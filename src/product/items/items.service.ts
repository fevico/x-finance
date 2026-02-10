import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { GetItemsQueryDto } from './dto/get-items-query.dto';
import { GetItemsResponseDto } from './dto/get-items-response.dto';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async createItem(entityId: string, body: CreateItemDto) {
    const item = await this.prisma.items.create({
      data: {
        ...body,
        entityId,
      },
    });

    return this.mapItemToDto(item);
  }

  async getItems(
    entityId: string,
    query: GetItemsQueryDto,
  ): Promise<GetItemsResponseDto> {
    const { page = 1, limit = 10, category, search } = query;
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

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.items.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.items.count({ where }),
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

    // Status: in_stock if currentStock > lowStock, else out_of_stock
    const status = currentStock > lowStock ? 'in_stock' : 'out_of_stock';

    return {
      ...item,
      status,
      unitPrice: item.sellingPrice,
    };
  }
}
