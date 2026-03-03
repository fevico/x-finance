import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  CreateOpeningBalanceDto,
  UpdateOpeningBalanceDto,
  GetOpeningBalanceResponseDto,
} from './dto/opening-balance.dto';
import { OpeningBalanceStatus } from 'prisma/generated/enums';
import { BullmqService } from '@/bullmq/bullmq.service';
import { generateJournalReference } from '@/auth/utils/helper';

interface AccountValidationResult {
  valid: boolean;
  error?: string;
  account?: any;
}

interface OpeningBalanceCreationResult extends GetOpeningBalanceResponseDto {
  validationSummary?: {
    successCount: number;
    failureCount: number;
    failedAccounts: Array<{ accountId: string; error: string }>;
  };
}

@Injectable()
export class OpeningBalanceService {
  constructor(
    private prisma: PrismaService,
    private bullmqService: BullmqService,
  ) {}

  /**
   * Create opening balance with validation and automatic journal posting
   *
   * Rules:
   * 1. Account balance must be 0
   * 2. No existing opening balance for the account
   * 3. Automatically posts to journal when created
   * 4. Supports partial success (succeeds where possible, reports failures)
   */
  async createOpeningBalance(
    entityId: string,
    dto: CreateOpeningBalanceDto,
  ): Promise<OpeningBalanceCreationResult> {
    try {
      // Check if entity exists
      const entity = await this.prisma.entity.findUnique({
        where: { id: entityId },
        select: { id: true },
      });

      if (!entity) {
        throw new UnauthorizedException('Entity not found or access denied');
      }

      // Get all accounts with their types for validation
      const accountIds = dto.items.map((item) => item.accountId);
      const accounts = await this.prisma.account.findMany({
        where: {
          id: { in: accountIds },
          entityId,
        },
        include: {
          subCategory: {
            include: {
              category: {
                include: {
                  type: true,
                },
              },
            },
          },
        },
      });

      const accountMap = new Map(accounts.map((acc) => [acc.id, acc]));

      // Validate each account and check for duplicates/balance issues
      const validationResults = new Map<string, AccountValidationResult>();
      const failedAccounts: Array<{ accountId: string; error: string }> = [];
      let validItemCount = 0;

      for (const item of dto.items) {
        const account = accountMap.get(item.accountId);

        if (!account) {
          const error = `Account ${item.accountId} not found or access denied`;
          validationResults.set(item.accountId, { valid: false, error });
          failedAccounts.push({ accountId: item.accountId, error });
          continue;
        }

        // Check if account balance is not 0
        if (account.balance !== 0) {
          const error = `Cannot set opening balance. Account balance is ${account.balance}. Only accounts with balance 0 are allowed.`;
          validationResults.set(item.accountId, { valid: false, error });
          failedAccounts.push({ accountId: item.accountId, error });
          continue;
        }

        // Check if opening balance already exists for this account
        const existingOpeningBalance =
          await this.prisma.openingBalanceItem.findFirst({
            where: { accountId: item.accountId },
          });

        if (existingOpeningBalance) {
          const error = `Opening balance already exists for this account`;
          validationResults.set(item.accountId, { valid: false, error });
          failedAccounts.push({ accountId: item.accountId, error });
          continue;
        }

        // Account passed all validations
        validationResults.set(item.accountId, { valid: true, account });
        validItemCount++;
      }

      // If no valid accounts, throw error
      if (validItemCount === 0) {
        throw new BadRequestException(
          `No valid accounts to create opening balance. Failures: ${failedAccounts.map((f) => `${f.accountId}: ${f.error}`).join('; ')}`,
        );
      }

      // Filter items to only valid accounts
      const validItems = dto.items.filter(
        (item) => validationResults.get(item.accountId)?.valid,
      );

      // Calculate totals from valid items only
      let totalDebit = 0;
      let totalCredit = 0;

      for (const item of validItems) {
        totalDebit += item.debit;
        totalCredit += item.credit;
      }

      const difference = totalCredit - totalDebit;

      // Create opening balance and items in a transaction (no journal posting yet)
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

        // Create opening balance items (without posting to journal yet)
        const items = await Promise.all(
          validItems.map((item) =>
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

      // Queue journal posting to BullMQ (async)
      await this.bullmqService.addJob('post-opening-balance-journal', {
        openingBalanceId: result.id,
        entityId,
        items: result.items,
        validItems,
        accountMap: Array.from(accountMap.entries()).map(([id, acc]) => ({
          id,
          account: acc,
        })),
      });

      // Add validation summary
      const response = result as OpeningBalanceCreationResult;
      response.validationSummary = {
        successCount: validItemCount,
        failureCount: failedAccounts.length,
        failedAccounts,
      };

      return response;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new HttpException(
        `Failed to create opening balance: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Post opening balance to journal (called asynchronously from BullMQ)
   * Creates journal entries and updates account balances
   */
  async postOpeningBalanceJournal(
    openingBalanceId: string,
    entityId: string,
    items: any[],
    validItems: any[],
    accountMapData: any[],
  ): Promise<void> {
    try {
      // Reconstruct account map from data
      const accountMap = new Map(
        accountMapData.map((item) => [item.id, item.account]),
      );

      // Process each item
      for (const item of items) {
        const validItem = validItems.find((vi) => vi.accountId === item.accountId);
        if (!validItem) continue;

        await this.prisma.$transaction(async (tx) => {
          await this.postOpeningBalanceToJournalInternal(
            tx,
            openingBalanceId,
            item.accountId,
            item.debit,
            item.credit,
            accountMap.get(item.accountId)!,
            entityId,
          );
        });
      }

      // Update opening balance status to completed
      await this.prisma.openingBalance.update({
        where: { id: openingBalanceId },
        data: { status: 'Finalized' },
      });
    } catch (error) {
      throw new HttpException(
        `Failed to post opening balance to journal: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Post single opening balance item to journal
   * Uses the posting rules:
   * - Assets/Expenses: Debit increases balance (normal balance = debit)
   * - Liabilities/Equity/Revenue: Credit increases balance (normal balance = credit)
   *
   * The offsetting entry goes to "Opening Balance Equity" account
   */
  private async postOpeningBalanceToJournalInternal(
    tx: any,
    openingBalanceId: string,
    accountId: string,
    debit: number,
    credit: number,
    account: any,
    entityId: string,
  ): Promise<void> {
    try {
      // Get Opening Balance Equity account
      const openingBalanceEquityAccount =
        await this.getOrCreateOpeningBalanceEquityAccount(tx, entityId);

      if (!openingBalanceEquityAccount) {
        throw new Error('Failed to get Opening Balance Equity account');
      }

      // Determine account type for proper debit/credit assignment
      const accountType = account.subCategory?.category?.type?.name;

      // Create journal lines based on account type and debit/credit
      const lines: any[] = [
        {
          accountId,
          debit,
          credit,
          description: `Opening Balance - ${account.name}`,
        },
      ];

      // Add offsetting line to Opening Balance Equity
      lines.push({
        accountId: openingBalanceEquityAccount.id,
        debit: credit,
        credit: debit,
        description: `Opening Balance Equity - ${account.name}`,
      });

      // Verify journal balances
      const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

      if (totalDebits !== totalCredits) {
        throw new Error(
          `Opening balance journal unbalanced for account ${accountId}: Debits ${totalDebits} != Credits ${totalCredits}`,
        );
      }

      // Create journal entry
      const journal = await tx.journal.create({
        data: {
          description: `Opening Balance - ${openingBalanceId} posted`,
          date: new Date(),
          reference: `OB-${openingBalanceId}`,
          entityId,
          lines: lines as any,
        },
      });

      // Update account balances
      for (const line of lines) {
        const accountDetail = await tx.account.findUnique({
          where: { id: line.accountId },
          include: {
            subCategory: {
              include: {
                category: {
                  include: {
                    type: true,
                  },
                },
              },
            },
          },
        });

        if (accountDetail) {
          // Calculate balance change based on account type
          const accType = accountDetail.subCategory?.category?.type?.name;
          let balanceChange = 0;

          if (accType === 'Asset' || accType === 'Expense') {
            // Assets/Expenses: Debit increases, Credit decreases
            balanceChange = line.debit - line.credit;
          } else {
            // Liabilities/Equity/Revenue: Credit increases, Debit decreases
            balanceChange = line.credit - line.debit;
          }

          // Update account balance
          const newBalance = accountDetail.balance + balanceChange;
          await tx.account.update({
            where: { id: line.accountId },
            data: { balance: newBalance },
          });
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to post opening balance: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get the Opening Balance Equity account (code: 3140-01)
   * This account must exist for the entity (created during entity setup via seeder)
   * Fails if account doesn't exist
   */
  private async getOrCreateOpeningBalanceEquityAccount(
    tx: any,
    entityId: string,
  ): Promise<any> {
    // Look for account with code "3140-01" for this entity
    const account = await tx.account.findFirst({
      where: {
        entityId,
        code: '3140-01',
      },
    });

    // If account not found, fail with clear error
    if (!account) {
      throw new BadRequestException(
        `Opening Balance Equity account (code: 3140-01) not found for entity. ` +
        `Please ensure the account has been created in Chart of Accounts during entity setup.`,
      );
    }

    return account;
  }

  async getOpeningBalance(
    id: string,
    entityId: string,
  ): Promise<GetOpeningBalanceResponseDto> {
    try {
      const openingBalance = await this.prisma.openingBalance.findFirst({
        where: { id, entityId },
        include: {
          items: true,
        },
      });

      if (!openingBalance) {
        throw new HttpException(
          'Opening balance not found',
          HttpStatus.NOT_FOUND,
        );
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

  async getOpeningBalanceByEntity(
    entityId: string,
  ): Promise<GetOpeningBalanceResponseDto | null> {
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
        throw new HttpException(
          'Opening balance not found',
          HttpStatus.NOT_FOUND,
        );
      }

      // Prevent updating finalized opening balance
      if (existing.status === 'Finalized') {
        throw new BadRequestException(
          'Cannot update a finalized opening balance',
        );
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
            throw new UnauthorizedException(
              `Account ${item.accountId} not found or access denied`,
            );
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
            fiscalYear:
              dto.fiscalYear !== undefined
                ? dto.fiscalYear
                : existing.fiscalYear,
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
      if (
        error instanceof HttpException ||
        error instanceof BadRequestException
      ) {
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
        throw new HttpException(
          'Opening balance not found',
          HttpStatus.NOT_FOUND,
        );
      }

      // Prevent deleting finalized opening balance
      if (existing.status === 'Finalized') {
        throw new BadRequestException(
          'Cannot delete a finalized opening balance',
        );
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
      if (
        error instanceof HttpException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new HttpException(
        `Failed to delete opening balance: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async finalizeOpeningBalance(
    id: string,
    entityId: string,
  ): Promise<GetOpeningBalanceResponseDto> {
    try {
      const existing = await this.prisma.openingBalance.findFirst({
        where: { id, entityId },
      });

      if (!existing) {
        throw new HttpException(
          'Opening balance not found',
          HttpStatus.NOT_FOUND,
        );
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
