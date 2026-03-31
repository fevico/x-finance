import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateStoreItemDto } from './dto/create-store-item.dto';
import { GetStoreItemsQueryDto } from './dto/get-store-items-query.dto';
import { GetStoreItemsResponseDto } from './dto/get-store-items-response.dto';

@Injectable()
export class StoreItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async createItem(entityId: string, body: CreateStoreItemDto) {
    const item = await this.prisma.storeItems.create({
      data: {
        ...body,
        entityId,
      },
    });

    return this.mapItemToDto(item);
  }

  async getItems(
    entityId: string,
    query: GetStoreItemsQueryDto,
  ): Promise<GetStoreItemsResponseDto> {
    const { page = 1, limit = 10, category, search, type } = query;
    const skip = (page - 1) * limit;


    const where: any = {
      entityId,
    };

    if (category) {
      where.category = {
        contains: category,
        mode: 'insensitive',
      };
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.storeItems.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.storeItems.count({ where }),
    ]);

    const mappedItems = items.map((item) => this.mapItemToDto(item));

    // Calculate in-stock and out-of-stock counts
    const totalInStock = mappedItems.filter(
      (i) => i.status === 'in_stock',
    ).length;
    const totalOutOfStock = mappedItems.filter(
      (i) => i.status === 'out_of_stock',
    ).length;

    const totalPages = Math.ceil(total / limit);

    return {
      items: mappedItems,
      total,
      totalInStock,
      totalOutOfStock,
      currentPage: page,
      pageSize: limit,
      totalPages,
    };
  }

  private mapItemToDto(item: any) {
    const currentStock = item.currentStock ?? 0;
    const lowStock = item.lowStock ?? 0;

    // Status: in_stock if currentStock > lowStock, else out_of_stock. If currentStock is 0, then low_stock
    const status =
      currentStock === 0
        ? 'out_of_stock'
        : currentStock > 0 && currentStock > lowStock
          ? 'in_stock'
          : 'low_stock';

    return {
      ...item,
      status,
      unitPrice: item.sellingPrice,
    };
  }
}
