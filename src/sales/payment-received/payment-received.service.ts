import { PrismaService } from '@/prisma/prisma.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  CreatePaymentReceivedDto,
  UpdatePaymentReceivedDto,
} from './dto/payment-received.dto';

@Injectable()
export class PaymentReceivedService {
  constructor(private prisma: PrismaService) {}

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

      // Create payment record with invoice total
      const paymentReceived = await this.prisma.paymentReceived.create({
        data: {
          ...body,
          total: invoice.total,
          entityId,
        },
        include: { invoice: { include: { customer: true } } },
      });

      return this.enrichPaymentRecords([paymentReceived])[0];
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async getPaymentReceivedById(paymentId: string, entityId: string) {
    try {
      const payment = await this.prisma.paymentReceived.findUnique({
        where: { id: paymentId },
        include: { invoice: { include: { customer: true } } },
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
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async getEntityPaymentRecords(
    entityId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [payments, totalCount] = await Promise.all([
        this.prisma.paymentReceived.findMany({
          where: { entityId },
          include: { invoice: { include: { customer: true } } },
          skip,
          take: Number(limit),
          orderBy: { paidAt: 'desc' },
        }),
        this.prisma.paymentReceived.count({ where: { entityId } }),
      ]);

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
        },
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit,
        },
      };
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
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

      const updatedPayment = await this.prisma.paymentReceived.update({
        where: { id: paymentId },
        data: { ...body },
        include: { invoice: { include: { customer: true } } },
      });

      return this.enrichPaymentRecords([updatedPayment])[0];
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
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
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async getAllPaymentReceivedWithStats(
    entityId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [payments, totalCount] = await Promise.all([
        this.prisma.paymentReceived.findMany({
          where: { entityId },
          include: { invoice: { include: { customer: true } } },
          skip,
          take: Number(limit),
          orderBy: { paidAt: 'desc' },
        }),
        this.prisma.paymentReceived.count({ where: { entityId } }),
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
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }
}
