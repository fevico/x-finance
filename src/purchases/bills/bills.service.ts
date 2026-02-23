import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { FileuploadService } from '@/fileupload/fileupload.service';
import { JournalPostingService } from '@/accounts/journal/journal-posting.service';
import { CreateBillDto } from './dto/bill.dto';
import { GetBillsQueryDto } from './dto/get-bills-query.dto';
import { GetBillsResponseDto } from './dto/get-bills-response.dto';
import { CreatePaymentDto, PaymentDto } from './dto/payment.dto';

@Injectable()
export class BillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileuploadService: FileuploadService,
    private readonly journalPostingService: JournalPostingService,
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
        throw new BadRequestException(`File upload failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const { items, ...billData } = body;

    // Parse and calculate item totals - NOW with expenseAccountId per item
    let subtotal = 0;
    const billItemsData = (JSON.parse(items as any) || []).map((item, index) => {
      // Validate required fields per item
      if (!item.name) {
        throw new BadRequestException(`Item ${index + 1}: name is required`);
      }
      if (!item.expenseAccountId) {
        throw new BadRequestException(
          `Item ${index + 1}: expenseAccountId is required`,
        );
      }

      const total = item.rate * item.quantity;
      subtotal += total;
      return {
        name: item.name,
        rate: item.rate,
        quantity: item.quantity,
        total,
        expenseAccountId: item.expenseAccountId, // Store per item
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    // Calculate tax and discount (default 0 if not provided)
    const tax = billData.tax ?? 0;
    const discount = billData.discount ?? 0;
    const total = subtotal + Number(tax) - Number(discount);

    // Create bill with JSON items (items now include expenseAccountId)
    const bill = await this.prisma.bills.create({
      data: {
        ...billData,
        entityId,
        subtotal,
        tax: Number(tax),
        discount: Number(discount),
        total,
        items: billItemsData,
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

    // Update bill status automatically
    await this.updateBillStatus(bill.id);

    // Post journal entry for vendor bill with PER-ITEM accounts
    try {
      await this.journalPostingService.postVendorBillWithItems(
        bill.id,
        entityId,
        {
          total: bill.total,
          subtotal: bill.subtotal,
          tax: bill.tax,
          items: billItemsData, // Pass items with expenseAccountId
        },
      );
    } catch (error) {
      console.error('Journal posting failed:', error instanceof Error ? error.message : String(error));
      // Don't throw - bill is already created, log the error for review
    }

    return bill;
  }

  async getBills(
    entityId: string,
    query: GetBillsQueryDto,
  ): Promise<GetBillsResponseDto & any> {
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
        take: Number(limit),
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
      items: (b.items as any[]) || [], // Items stored as JSON array
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
      items: (bill.items as any[]) || [], // Items stored as JSON array
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

  private async updateBillStatus(billId: string) {
    const bill = await this.prisma.bills.findUnique({
      where: { id: billId },
      include: { paymentRecord: true },
    });

    if (!bill) return;

    const totalPaid = bill.paymentRecord.reduce((sum, p) => sum + p.amount, 0);

    let status: any = 'unpaid';
    if (totalPaid >= bill.total) {
      status = 'paid';
    } else if (totalPaid > 0) {
      status = 'partial';
    }

    await this.prisma.bills.update({
      where: { id: billId },
      data: { status },
    });
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
        amount: body.amount,
        note: body.note ?? undefined,
      },
    });

    // Update bill status automatically
    await this.updateBillStatus(billId);

    // Post journal entry for bill payment
    // Requires cashAccountId in payment data (account field)
    if (body.account) {
      try {
        await this.journalPostingService.postBillPayment(
          payment.id,
          billId,
          entityId,
          {
            amount: body.amount,
            cashAccountId: body.account,
          },
        );
      } catch (error) {
        console.error('Journal posting failed:', error instanceof Error ? error.message : String(error));
        // Don't throw - payment is already created, log the error for review
      }
    }

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
        take: Number(limit),
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

  async updateBill(
    billId: string,
    entityId: string,
    body: any,
    file?: Express.Multer.File,
  ) {
    try {
      const bill = await this.prisma.bills.findUnique({
        where: { id: billId },
      });

      if (!bill || bill.entityId !== entityId) {
        throw new BadRequestException('Bill not found for this entity');
      }

      let attachment = bill.attachment as any;

      // Upload new file if provided
      if (file) {
        // Delete old attachment if exists
        if (attachment?.publicId) {
          await this.fileuploadService.deleteFile(attachment.publicId);
        }

        const uploadedFile = await this.fileuploadService.uploadFile(
          file,
          `bills/${entityId}`,
        );
        attachment = {
          publicId: uploadedFile.publicId,
          secureUrl: uploadedFile.secureUrl,
        };
      }

      const { items, ...billData } = body;

      // Calculate new bill items and totals - NOW with expenseAccountId per item
      let subtotal = 0;
      const billItemsData = (items || []).map((item, index) => {
        // Validate required fields per item
        if (!item.name) {
          throw new BadRequestException(`Item ${index + 1}: name is required`);
        }
        if (!item.expenseAccountId) {
          throw new BadRequestException(
            `Item ${index + 1}: expenseAccountId is required`,
          );
        }

        const total = item.rate * item.quantity;
        subtotal += total;
        return {
          name: item.name,
          rate: item.rate,
          quantity: item.quantity,
          total,
          expenseAccountId: item.expenseAccountId, // Store per item
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
      const tax = billData.tax ?? 0;
      const discount = billData.discount ?? 0;
      const total = subtotal + tax - discount;

      // Update bill with new JSON items (including expenseAccountId)
      await this.prisma.bills.update({
        where: { id: billId },
        data: {
          ...billData,
          subtotal,
          tax,
          discount,
          total,
          items: billItemsData,
          ...(file && { attachment }),
        },
      });

      // Re-calculate status in case total or payments changed
      await this.updateBillStatus(billId);

      return this.getBillById(entityId, billId);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Update failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteBill(billId: string, entityId: string) {
    try {
      const bill = await this.prisma.bills.findUnique({
        where: { id: billId },
      });

      if (!bill || bill.entityId !== entityId) {
        throw new BadRequestException('Bill not found for this entity');
      }

      // Delete attachment from Cloudinary if exists
      const attachment = bill.attachment as any;
      if (attachment?.publicId) {
        await this.fileuploadService.deleteFile(attachment.publicId);
      }

      await this.prisma.bills.delete({
        where: { id: billId },
      });

      return { message: 'Bill deleted successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Delete failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

}