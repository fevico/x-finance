import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRestockHistoryDto, UpdateRestockHistoryDto } from './restock-history.dto';

@Injectable()
export class RestockHistoryService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateRestockHistoryDto, entityId: string) {
    try {
      return await this.prisma.supplyRestockHistory.create({
        data: { ...createDto, entityId },
      });
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(entityId: string) {
    try {
      return await this.prisma.supplyRestockHistory.findMany({
        where: { entityId },
        orderBy: { restockDate: 'desc' },
      });
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string, entityId: string) {
    try {
      const restock = await this.prisma.supplyRestockHistory.findFirst({ where: { id, entityId } });
      if (!restock) throw new HttpException('Restock not found', HttpStatus.NOT_FOUND);
      return restock;
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateDto: UpdateRestockHistoryDto, entityId: string) {
    try {
      const restock = await this.prisma.supplyRestockHistory.findFirst({ where: { id, entityId } });
      if (!restock) throw new HttpException('Restock not found', HttpStatus.NOT_FOUND);
      return await this.prisma.supplyRestockHistory.update({ where: { id }, data: updateDto });
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string, entityId: string) {
    try {
      const restock = await this.prisma.supplyRestockHistory.findFirst({ where: { id, entityId } });
      if (!restock) throw new HttpException('Restock not found', HttpStatus.NOT_FOUND);
      await this.prisma.supplyRestockHistory.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
