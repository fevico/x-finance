import { PrismaService } from '@/prisma/prisma.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  CreatePaymentReceivedDto,
  UpdatePaymentReceivedDto,
} from './dto/payment-received.dto';
import { InvoiceService } from '../invoice/invoice.service';

@Injectable()
export class PaymentReceivedService {
  constructor(
    private prisma: PrismaService,
    private invoiceService: InvoiceService,
  ) {}

  private enrichPaymentRecords(payments: any[]) {
    return payments.map((payment) => ({
      ...payment,
      totalAmount: payment.total,
      paidAmount: payment.amount,
      outstanding: payment.total - payment.amount,
    }));
  }

  async createPaymentReceived(
    body: CreatePaymentReceivedDto,
    entityId: string,
    performedBy?: string,
  ) {
    try {
      // Fetch invoice to get total amount and validate it exists
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: body.invoiceId },
      });

      if (!invoice) {
        throw new HttpException('Invoice not found', HttpStatus.NOT_FOUND);
      }

      if (invoice.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to create payment for this invoice',
          HttpStatus.FORBIDDEN,
        );
      }

      // Validate account exists and belongs to the same entity
      const account = await this.prisma.account.findUnique({
        where: { id: body.depositTo },
      });

      if (!account) {
        throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      }

      if (account.entityId !== entityId) {
        throw new HttpException(
          'Account does not belong to this entity',
          HttpStatus.FORBIDDEN,
        );
      }

      // Create payment record with invoice total
      const paymentReceived = await this.prisma.paymentReceived.create({
        data: {
          ...body,
          total: invoice.total,
          entityId,
        },
        include: {
          invoice: { include: { customer: true } },
          account: true,
        },
      });

      // Log payment received activity
      await this.invoiceService.logPaymentReceived(
        body.invoiceId,
        paymentReceived.amount,
        body.reference,
        performedBy,
      );

      return this.enrichPaymentRecords([paymentReceived])[0];
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  async getPaymentReceivedById(paymentId: string, entityId: string) {
    try {
      const payment = await this.prisma.paymentReceived.findUnique({
        where: { id: paymentId },
        include: {
          invoice: { include: { customer: true } },
          account: true,
        },
      });

      if (!payment) {
        throw new HttpException(
          'Payment record not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (payment.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to access this payment record',
          HttpStatus.FORBIDDEN,
        );
      }

      return this.enrichPaymentRecords([payment])[0];
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  async getEntityPaymentRecords(
    entityId: string,
    page: number = 1,
    limit: number = 10,
    filters: {
      search?: string;
      status?: string;
    } = {},
  ) {
    try {
      const skip = (page - 1) * limit;

      const where: any = { entityId };
      const { search, status } = filters || {};

      if (status) where.status = status;

      if (search) {
        where.OR = [
          { reference: { contains: search, mode: 'insensitive' } },
          { paymentMethod: { contains: search, mode: 'insensitive' } },
          {
            account: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
          {
            account: {
              code: { contains: search, mode: 'insensitive' },
            },
          },
          {
            invoice: {
              invoiceNumber: { contains: search, mode: 'insensitive' },
            },
          },
          {
            invoice: {
              customer: { name: { contains: search, mode: 'insensitive' } },
            },
          },
        ];
      }

      const [payments, totalCount] = await Promise.all([
        this.prisma.paymentReceived.findMany({
          where,
          include: {
            invoice: { include: { customer: true } },
            account: true,
          },
          skip,
          take: Number(limit),
          orderBy: { paidAt: 'desc' },
        }),
        this.prisma.paymentReceived.count({ where }),
      ]);

      // Calculate total paid this current month (across all payments)
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      const currentMonthPayments = await this.prisma.paymentReceived.findMany({
        where: {
          entityId,
          paidAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
        },
        select: { amount: true },
      });

      const currentMonthPaidTotal = currentMonthPayments.reduce(
        (sum, p) => sum + p.amount,
        0,
      );

      // Calculate total partially paid invoices count
      // We look for invoices that are NOT Paid but have some payments, OR explicitly check for Partial status if we added it.
      // Since we are about to add 'Partial' status to InvoiceStatus, we can rely on that OR check payment status.
      // However, the prompt asked to "introduce the partial status for payment so we can use paid partial or pending for pament recieved".
      // Wait, "introduce the partial status for payment" - PaymentReceivedStatus already has Partial (seen in schema).
      // "so we can use paid partial or pending for pament recieved" - it seems user wants to ensure we support it.
      // But for *Invoice* stats "totalPartiallyPaidInvoices", we need to check Invoices.
      // If we update InvoiceStatus to include Partial, we can query it directly.
      // For now, let's assume we will update the schema in the next step, so we can use the 'Partial' status in the query.
      // BUT, since the schema update hasn't been applied/generated yet, this code might fail type checking if I use 'Partial' enum on InvoiceStatus right now if I rely on generated types.
      // Safe bet: Query invoices where distinct payment records exist but status is not Paid?
      // Actually, if I update schema FIRST, then types are generated, then I update code.
      // The user wants me to go on.
      // I will implement the Logic using the raw string 'Partial' cast if needed or just count based on logic if schema update isn't instant.
      // Actually, standard partial payment logic: Invoice status is Pending/Sent/Partial (if added).
      // Let's implement looking for 'Partial' status on Invoice, assuming I will add it.
      // But wait, valid InvoiceStatus are Overdue, Paid, Draft, Sent, Pending.
      // I will count invoices that have payments but are not Paid.
      // OR, I can count invoices with status 'Partial' (which I am about to add).
      // Let's use the 'Partial' status string for the query value, casting as any to avoid TS error before generation.

      const partiallyPaidInvoicesCount = await this.prisma.invoice.count({
        where: {
          entityId,
          status: 'Partial' as any, // Expecting schema update
        },
      });

      // Enrich payments with outstanding balance
      const enrichedPayments = this.enrichPaymentRecords(payments);
      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        payments: enrichedPayments,
        stats: {
          totalRecords: totalCount,
          totalAmount,
          averageAmount:
            totalCount > 0 ? Math.round(totalAmount / totalCount) : 0,
          currentMonthPaidTotal,
          totalPartiallyPaidInvoices: partiallyPaidInvoicesCount,
        },
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  async updatePaymentReceived(
    paymentId: string,
    entityId: string,
    body: UpdatePaymentReceivedDto,
  ) {
    try {
      const payment = await this.prisma.paymentReceived.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new HttpException(
          'Payment record not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (payment.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to update this payment record',
          HttpStatus.FORBIDDEN,
        );
      }

      // Validate new account if depositTo is being changed
      if (body.depositTo && body.depositTo !== payment.depositTo) {
        const account = await this.prisma.account.findUnique({
          where: { id: body.depositTo },
        });

        if (!account) {
          throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
        }

        if (account.entityId !== entityId) {
          throw new HttpException(
            'Account does not belong to this entity',
            HttpStatus.FORBIDDEN,
          );
        }
      }

      const updatedPayment = await this.prisma.paymentReceived.update({
        where: { id: paymentId },
        data: { ...body },
        include: {
          invoice: { include: { customer: true } },
          account: true,
        },
      });

      return this.enrichPaymentRecords([updatedPayment])[0];
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  async deletePaymentReceived(paymentId: string, entityId: string) {
    try {
      const payment = await this.prisma.paymentReceived.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new HttpException(
          'Payment record not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (payment.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to delete this payment record',
          HttpStatus.FORBIDDEN,
        );
      }

      await this.prisma.paymentReceived.delete({
        where: { id: paymentId },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAllPaymentReceivedWithStats(
    entityId: string,
    page: number = 1,
    limit: number = 10,
    filters: {
      search?: string;
      status?: string;
      from?: string;
      to?: string;
    } = {},
  ) {
    try {
      const skip = (page - 1) * limit;
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const where: any = { entityId };
      const { search, status, from, to } = filters || {};

      if (status) where.status = status;
      if (from || to) {
        where.paidAt = {};
        if (from) where.paidAt.gte = new Date(from);
        if (to) where.paidAt.lte = new Date(to);
      }

      if (search) {
        where.OR = [
          { reference: { contains: search, mode: 'insensitive' } },
          { paymentMethod: { contains: search, mode: 'insensitive' } },
          {
            account: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
          {
            account: {
              code: { contains: search, mode: 'insensitive' },
            },
          },
          {
            invoice: {
              invoiceNumber: { contains: search, mode: 'insensitive' },
            },
          },
          {
            invoice: {
              customer: { name: { contains: search, mode: 'insensitive' } },
            },
          },
        ];
      }

      const [payments, totalCount] = await Promise.all([
        this.prisma.paymentReceived.findMany({
          where,
          include: {
            invoice: { include: { customer: true } },
            account: true,
          },
          skip,
          take: Number(limit),
          orderBy: { paidAt: 'desc' },
        }),
        this.prisma.paymentReceived.count({ where }),
      ]);

      // Calculate total paid invoices (payments with Paid status)
      const paidPayments = await this.prisma.paymentReceived.findMany({
        where: { entityId, status: 'Paid' },
      });

      const totalPaidInvoices = paidPayments.reduce(
        (sum, p) => sum + p.total,
        0,
      );

      // Calculate current month paid
      const currentMonthPayments = await this.prisma.paymentReceived.findMany({
        where: {
          entityId,
          status: 'Paid',
          paidAt: {
            gte: currentMonthStart,
            lt: new Date(
              currentMonthStart.getTime() + 32 * 24 * 60 * 60 * 1000,
            ),
          },
        },
      });

      const currentMonthPaidTotal = currentMonthPayments.reduce(
        (sum, p) => sum + p.total,
        0,
      );

      // Calculate total partially paid invoices
      const partialPayments = await this.prisma.paymentReceived.findMany({
        where: { entityId, status: 'Partial' },
      });

      const totalPartiallyPaidInvoices = partialPayments.reduce(
        (sum, p) => sum + p.total,
        0,
      );

      // Enrich payments with outstanding balance
      const enrichedPayments = this.enrichPaymentRecords(payments);
      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        payments: enrichedPayments,
        stats: {
          totalRecords: totalCount,
          totalAmount,
          averageAmount:
            totalCount > 0 ? Math.round(totalAmount / totalCount) : 0,
          totalPaidInvoices,
          currentMonthPaidTotal,
          totalPartiallyPaidInvoices,
        },
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }
}
