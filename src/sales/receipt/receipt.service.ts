import { PrismaService } from '@/prisma/prisma.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateReceiptDto, UpdateReceiptDto } from './dto/receipt.dto';
import { GetReceiptsQueryDto } from './dto/get-receipts-query.dto';
import { GetReceiptsResponseDto } from './dto/get-receipts-response.dto';
import { ReceiptStatus, PaymentMethod } from 'prisma/generated/enums';
import { generateRandomInvoiceNumber } from '@/auth/utils/helper';

@Injectable()
export class ReceiptService {
  constructor(private prisma: PrismaService) {}

  async createReceipt(body: CreateReceiptDto, entityId: string) {
    try {
      const receiptNumber = generateRandomInvoiceNumber({ prefix: 'RCT' });
      const { items, ...receiptData } = body;

      const receipt = await this.prisma.receipt.create({
        data: {
          ...receiptData,
          entityId,
          receiptNumber,
          receiptItem: {
            create: items.map((item) => ({
              itemId: item.itemId,
              rate: item.rate,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          receiptItem: { include: { item: true } },
        },
      });
      return receipt;
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.BAD_GATEWAY);
    }
  }

  async getEntityReceipts(
    entityId: string,
    query: GetReceiptsQueryDto,
  ): Promise<any> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const whereClause: any = { entityId };
      if (query.status) whereClause.status = query.status;
      if (query.paymentMethod) whereClause.paymentMethod = query.paymentMethod;
      if (query.search) {
        whereClause.customer = {
          name: {
            contains: query.search,
            mode: 'insensitive',
          },
        };
      }

      // Paginated receipts
      const [receipts, totalCount] = await Promise.all([
        this.prisma.receipt.findMany({
          where: whereClause,
          include: {
            customer: true,
            receiptItem: { include: { item: true } },
          },
          skip,
          take: Number(limit),
          orderBy: { date: 'desc' },
        }),
        this.prisma.receipt.count({ where: whereClause }),
      ]);

      // Aggregates for filtered set
      const aggregate = await this.prisma.receipt.aggregate({
        _sum: { total: true },
        _count: { _all: true },
        where: whereClause,
      });

      const totalSales = aggregate._sum.total ?? 0;
      const totalReceipts = aggregate._count._all ?? 0;

      // Today's sales
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
      );
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
      );

      const todaysWhere = {
        ...whereClause,
        date: { gte: startOfDay, lte: endOfDay },
      };
      const todaysAggregate = await this.prisma.receipt.aggregate({
        _sum: { total: true },
        where: todaysWhere,
      });
      const todaysSales = todaysAggregate._sum.total ?? 0;

      const averageReceiptValue =
        totalReceipts > 0 ? Math.round(totalSales / totalReceipts) : 0;

      const transformed = receipts.map((r) => ({
        id: r.id,
        customerId: r.customerId,
        customerName: r.customer?.name,
        date: r.date.toISOString(),
        paymentMethod: r.paymentMethod,
        items: r.receiptItem, // Return structured items
        total: r.total,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      }));

      const totalPages = Math.ceil(totalCount / limit);

      return {
        receipts: transformed,
        stats: {
          totalReceipts,
          totalSales,
          todaysSales,
          averageReceiptValue,
        },
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      };
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async getReceiptById(receiptId: string, entityId: string) {
    try {
      const receipt = await this.prisma.receipt.findUnique({
        where: { id: receiptId },
        include: {
          customer: true,
          receiptItem: { include: { item: true } },
        },
      });

      if (!receipt) {
        throw new HttpException('Receipt not found', HttpStatus.NOT_FOUND);
      }

      if (receipt.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to access this receipt',
          HttpStatus.FORBIDDEN,
        );
      }

      return receipt;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async updateReceipt(
    receiptId: string,
    entityId: string,
    body: UpdateReceiptDto,
  ) {
    try {
      const receipt = await this.prisma.receipt.findUnique({
        where: { id: receiptId },
      });

      if (!receipt) {
        throw new HttpException('Receipt not found', HttpStatus.NOT_FOUND);
      }

      if (receipt.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to update this receipt',
          HttpStatus.FORBIDDEN,
        );
      }

      const { items, removeItemIds, ...receiptData } = body;

      // Delete removed items
      if (removeItemIds && removeItemIds.length > 0) {
        await this.prisma.receiptItem.deleteMany({
          where: {
            id: { in: removeItemIds },
            receiptId: receiptId,
          },
        });
      }

      // Handle items create/update
      if (items && items.length > 0) {
        for (const item of items) {
          if (item.id) {
            // Update existing
            await this.prisma.receiptItem.update({
              where: { id: item.id },
              data: {
                itemId: item.itemId,
                rate: item.rate,
                quantity: item.quantity,
              },
            });
          } else {
            // Create new
            await this.prisma.receiptItem.create({
              data: {
                itemId: item.itemId,
                rate: item.rate,
                quantity: item.quantity,
                receiptId: receiptId,
              },
            });
          }
        }
      }

      const updatedReceipt = await this.prisma.receipt.update({
        where: { id: receiptId },
        data: receiptData,
        include: {
          customer: true,
          receiptItem: { include: { item: true } },
        },
      });

      return updatedReceipt;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async toggleReceiptStatus(receiptId: string, entityId: string) {
    try {
      const receipt = await this.prisma.receipt.findUnique({
        where: { id: receiptId },
      });

      if (!receipt) {
        throw new HttpException('Receipt not found', HttpStatus.NOT_FOUND);
      }

      if (receipt.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to update this receipt',
          HttpStatus.FORBIDDEN,
        );
      }

      // Toggle status between Void and Completed
      const newStatus =
        receipt.status === ReceiptStatus.Void
          ? ReceiptStatus.Completed
          : ReceiptStatus.Void;

      const updatedReceipt = await this.prisma.receipt.update({
        where: { id: receiptId },
        data: { status: newStatus },
        include: {
          customer: true,
          receiptItem: { include: { item: true } },
        },
      });

      return updatedReceipt;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }
}
