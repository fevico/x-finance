import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { FileuploadService } from '@/fileupload/fileupload.service';
import { CreateBillDto } from './dto/bill.dto';
import { GetBillsQueryDto } from './dto/get-bills-query.dto';
import { GetBillsResponseDto } from './dto/get-bills-response.dto';

@Injectable()
export class BillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileuploadService: FileuploadService,
  ) {}

  async createBill(
    body: CreateBillDto,
    entityId: string,
    file?: Express.Multer.File,
  ): Promise<any> {
    let attachment: { publicId: string; secureUrl: string } | undefined =
      undefined;

    if (file) {
      try {
        const uploadResult = await this.fileuploadService.uploadFile(
          file,
          `bills/${entityId}`,
        );
        attachment = {
          publicId: uploadResult.publicId,
          secureUrl: uploadResult.secureUrl,
        };
      } catch (error) {
        throw new BadRequestException(`File upload failed: ${error.message}`);
      }
    }

    const bill = await this.prisma.bills.create({
      data: {
        ...body,
        entityId,
        attachment: attachment
          ? { publicId: attachment.publicId, secureUrl: attachment.secureUrl }
          : undefined,
      },
      include: {
        vendor: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return bill;
  }

  async getBills(
    entityId: string,
    query: GetBillsQueryDto,
  ): Promise<GetBillsResponseDto> {
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
        {
          billNumber: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          poNumber: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          vendor: {
            displayName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const [bills, total] = await Promise.all([
      this.prisma.bills.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              displayName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          billDate: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.bills.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Normalize nullable fields (Prisma may return null) and format createdAt
    const transformedBills = bills.map((b) => ({
      ...b,
      billNumber: b.billNumber ?? undefined,
      poNumber: b.poNumber ?? undefined,
      notes: b.notes ?? undefined,
      attachment:
        b.attachment === null
          ? undefined
          : (b.attachment as Record<string, any>),
      createdAt:
        b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
    }));

    return {
      bills: transformedBills,
      total,
      currentPage: page,
      pageSize: limit,
      totalPages,
    };
  }
}
