import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { FileuploadService } from '@/fileupload/fileupload.service';
import { CreateBillDto } from './dto/bill.dto';
import { GetBillsQueryDto } from './dto/get-bills-query.dto';
import { GetBillsResponseDto } from './dto/get-bills-response.dto';
import { CreatePaymentDto, PaymentDto } from './dto/payment.dto';

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

  async getBillById(entityId: string, billId: string) {
    const bill = await this.prisma.bills.findUnique({
      where: { id: billId },
      include: {
        vendor: {
          select: { id: true, displayName: true, email: true, phone: true },
        },
        paymentRecord: true,
      },
    });

    if (!bill || bill.entityId !== entityId) return null;

    return {
      ...bill,
      billNumber: bill.billNumber ?? undefined,
      poNumber: bill.poNumber ?? undefined,
      notes: bill.notes ?? undefined,
      attachment:
        bill.attachment === null
          ? undefined
          : (bill.attachment as Record<string, any>),
      createdAt:
        bill.createdAt instanceof Date
          ? bill.createdAt.toISOString()
          : bill.createdAt,
      paymentRecord: bill.paymentRecord.map((p) => ({
        ...p,
        note: p.note ?? undefined,
        paidAt: p.paidAt instanceof Date ? p.paidAt.toISOString() : p.paidAt,
        createdAt:
          p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      })),
    };
  }

  async createPayment(
    billId: string,
    entityId: string,
    body: CreatePaymentDto,
  ): Promise<any> {
    // Ensure bill belongs to entity
    const bill = await this.prisma.bills.findUnique({ where: { id: billId } });
    if (!bill || bill.entityId !== entityId) {
      throw new BadRequestException('Bill not found for this entity');
    }

    const payment = await this.prisma.paymentRecord.create({
      data: {
        billId,
        paidAt: body.paidAt,
        paymentMethod: body.paymentMethod,
        reference: body.reference,
        account: body.account,
        note: body.note ?? undefined,
      },
    });

    // Optionally update bill status to paid
    await this.prisma.bills.update({
      where: { id: billId },
      data: { status: 'paid' },
    });

    return {
      ...payment,
      note: payment.note ?? undefined,
    };
  }

  async getPayments(entityId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.paymentRecord.findMany({
        where: {
          bill: { entityId },
        },
        include: {
          bill: {
            select: {
              vendor: { select: { displayName: true } },
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.paymentRecord.count({ where: { bill: { entityId } } }),
    ]);

    const paymentsTransformed = payments.map((p) => ({
      ...p,
      paidAt: p.paidAt instanceof Date ? p.paidAt.toISOString() : p.paidAt,
      createdAt:
        p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      note: p.note ?? undefined,
      vendorName: p.bill?.vendor?.displayName ?? undefined,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      payments: paymentsTransformed,
      total,
      currentPage: page,
      pageSize: limit,
      totalPages,
    };
  }
}
