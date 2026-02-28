import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateOpeningBalanceDto, UpdateOpeningBalanceDto, GetOpeningBalanceResponseDto } from './dto/opening-balance.dto';
import { OpeningBalanceStatus } from 'prisma/generated/enums';

@Injectable()
export class OpeningBalanceService {
  constructor(private prisma: PrismaService) {}

  async createOpeningBalance(
    entityId: string,
    dto: CreateOpeningBalanceDto,
  ): Promise<GetOpeningBalanceResponseDto> {
    try {
      // Check if entity exists
      const entity = await this.prisma.entity.findUnique({
        where: { id: entityId },
        select: { id: true },
      });

      if (!entity) {
        throw new UnauthorizedException('Entity not found or access denied');
      }

      // Calculate totals from items
      let totalDebit = 0;
      let totalCredit = 0;

      for (const item of dto.items) {
        // Verify account belongs to this entity
        const account = await this.prisma.account.findFirst({
          where: { id: item.accountId, entityId },
          select: { id: true },
        });

        if (!account) {
          throw new UnauthorizedException(`Account ${item.accountId} not found or access denied`);
        }

        totalDebit += item.debit;
        totalCredit += item.credit;
      }

      const difference = totalCredit - totalDebit;

      // Create opening balance and items in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        const openingBalance = await tx.openingBalance.create({
          data: {
            entityId,
            date: dto.date,
            fiscalYear: dto.fiscalYear || null,
            totalDebit,
            totalCredit,
            difference,
            status: 'Draft',
            note: dto.note || null,
          },
        });

        // Create opening balance items
        const items = await Promise.all(
          dto.items.map((item) =>
            tx.openingBalanceItem.create({
              data: {
                openingBalanceId: openingBalance.id,
                accountId: item.accountId,
                debit: item.debit,
                credit: item.credit,
              },
            }),
          ),
        );

        return {
          ...openingBalance,
          items,
        };
      });

      return result as GetOpeningBalanceResponseDto;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        `Failed to create opening balance: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getOpeningBalance(id: string, entityId: string): Promise<GetOpeningBalanceResponseDto> {
    try {
      const openingBalance = await this.prisma.openingBalance.findFirst({
        where: { id, entityId },
        include: {
          items: true,
        },
      });

      if (!openingBalance) {
        throw new HttpException('Opening balance not found', HttpStatus.NOT_FOUND);
      }

      return openingBalance as GetOpeningBalanceResponseDto;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get opening balance: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getOpeningBalanceByEntity(entityId: string): Promise<GetOpeningBalanceResponseDto | null> {
    try {
      // Check if entity exists
      const entity = await this.prisma.entity.findUnique({
        where: { id: entityId },
        select: { id: true },
      });

      if (!entity) {
        throw new UnauthorizedException('Entity not found or access denied');
      }

      const openingBalance = await this.prisma.openingBalance.findFirst({
        where: { entityId },
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return openingBalance as GetOpeningBalanceResponseDto | null;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get opening balance: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateOpeningBalance(
    id: string,
    entityId: string,
    dto: UpdateOpeningBalanceDto,
  ): Promise<GetOpeningBalanceResponseDto> {
    try {
      // Get existing opening balance
      const existing = await this.prisma.openingBalance.findFirst({
        where: { id, entityId },
      });

      if (!existing) {
        throw new HttpException('Opening balance not found', HttpStatus.NOT_FOUND);
      }

      // Prevent updating finalized opening balance
      if (existing.status === 'Finalized') {
        throw new BadRequestException('Cannot update a finalized opening balance');
      }

      // Calculate new totals if items are provided
      let totalDebit = existing.totalDebit;
      let totalCredit = existing.totalCredit;

      if (dto.items && dto.items.length > 0) {
        totalDebit = 0;
        totalCredit = 0;

        for (const item of dto.items) {
          // Verify account belongs to this entity
          const account = await this.prisma.account.findFirst({
            where: { id: item.accountId, entityId },
            select: { id: true },
          });

          if (!account) {
            throw new UnauthorizedException(`Account ${item.accountId} not found or access denied`);
          }

          totalDebit += item.debit;
          totalCredit += item.credit;
        }
      }

      const difference = totalCredit - totalDebit;

      // Update in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Delete existing items if new items provided
        if (dto.items && dto.items.length > 0) {
          await tx.openingBalanceItem.deleteMany({
            where: { openingBalanceId: id },
          });
        }

        // Update opening balance
        const updated = await tx.openingBalance.update({
          where: { id },
          data: {
            date: dto.date || existing.date,
            fiscalYear: dto.fiscalYear !== undefined ? dto.fiscalYear : existing.fiscalYear,
            totalDebit,
            totalCredit,
            difference,
            note: dto.note !== undefined ? dto.note : existing.note,
          },
        });

        // Create new items if provided
        let items: any[] = [];
        if (dto.items && dto.items.length > 0) {
          items = await Promise.all(
            dto.items.map((item) =>
              tx.openingBalanceItem.create({
                data: {
                  openingBalanceId: id,
                  accountId: item.accountId,
                  debit: item.debit,
                  credit: item.credit,
                },
              }),
            ),
          );
        } else {
          items = await tx.openingBalanceItem.findMany({
            where: { openingBalanceId: id },
          });
        }

        return {
          ...updated,
          items,
        };
      });

      return result as GetOpeningBalanceResponseDto;
    } catch (error) {
      if (error instanceof HttpException || error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        `Failed to update opening balance: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteOpeningBalance(id: string, entityId: string): Promise<void> {
    try {
      const existing = await this.prisma.openingBalance.findFirst({
        where: { id, entityId },
      });

      if (!existing) {
        throw new HttpException('Opening balance not found', HttpStatus.NOT_FOUND);
      }

      // Prevent deleting finalized opening balance
      if (existing.status === 'Finalized') {
        throw new BadRequestException('Cannot delete a finalized opening balance');
      }

      // Delete in transaction (items will be deleted due to CASCADE)
      await this.prisma.$transaction(async (tx) => {
        await tx.openingBalanceItem.deleteMany({
          where: { openingBalanceId: id },
        });

        await tx.openingBalance.delete({
          where: { id },
        });
      });
    } catch (error) {
      if (error instanceof HttpException || error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        `Failed to delete opening balance: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async finalizeOpeningBalance(id: string, entityId: string): Promise<GetOpeningBalanceResponseDto> {
    try {
      const existing = await this.prisma.openingBalance.findFirst({
        where: { id, entityId },
      });

      if (!existing) {
        throw new HttpException('Opening balance not found', HttpStatus.NOT_FOUND);
      }

      const updated = await this.prisma.openingBalance.update({
        where: { id },
        data: {
          status: 'Finalized',
        },
        include: {
          items: true,
        },
      });

      return updated as GetOpeningBalanceResponseDto;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to finalize opening balance: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
