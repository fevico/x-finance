import { PrismaService } from '@/prisma/prisma.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { generateRandomInvoiceNumber } from '@/auth/utils/helper';
import { GetInvoicesQueryDto } from './dto/get-invoices-query.dto';
import { GetEntityInvoicesResponseDto } from './dto/get-entity-invoices-response.dto';
import { GetPaidInvoicesResponseDto } from './dto/get-paid-invoices-response.dto';
import { GetPaidInvoicesQueryDto } from './dto/get-paid-invoices-query.dto';
import { InvoiceStatus, InvoiceActivityType } from 'prisma/generated/enums';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log an activity for an invoice
   */
  private async logActivity(
    invoiceId: string,
    activityType: InvoiceActivityType,
    description: string,
    performedBy?: string,
    metadata?: any,
  ) {
    try {
      await this.prisma.invoiceActivity.create({
        data: {
          invoiceId,
          activityType,
          description,
          performedBy,
          metadata,
        },
      });
    } catch (error) {
      console.error(
        'Error logging invoice activity:',
        error instanceof Error ? error.message : String(error),
      );
      // Don't throw, as this shouldn't fail the main operation
    }
  }

  // async createInvoice(body: CreateInvoiceDto, entityId: string) {
  //   try {
  //     const invoiceNumber = generateRandomInvoiceNumber();
  //     const invoice = await this.prisma.invoice.create({
  //       data: {
  //         ...body,
  //         invoiceNumber,
  //         entityId,
  //       },
  //     });
  //     return invoice;
  //   } catch (error) {
  //     throw new HttpException(`${error.message}`, HttpStatus.CONFLICT);
  //   }
  // }

  async createInvoice(
    body: CreateInvoiceDto,
    entityId: string,
    performedBy?: string,
  ) {
    try {
      const invoiceNumber = generateRandomInvoiceNumber({ prefix: 'INV' });

      // Extract items from body
      const { items, ...invoiceData } = body;

      // Create invoice with invoice items in a transaction
      const invoice = await this.prisma.invoice.create({
        data: {
          ...invoiceData,
          invoiceNumber,
          entityId,
        },
        include: {
          customer: { select: { name: true, id: true } },
          invoiceItem: true,
          activities: true,
        },
      });

      // Log activity: Invoice Created
      await this.logActivity(
        invoice.id,
        InvoiceActivityType.Created,
        'Invoice created',
        performedBy,
        { invoiceNumber },
      );

      // Create invoice items if provided
      if (items && items.length > 0) {
        const invoiceItems = await Promise.all(
          items.map((item) =>
            this.prisma.invoiceItem.create({
              data: {
                itemId: item.itemId,
                rate: item.rate,
                quantity: item.quantity,
                invoiceId: invoice.id,
              },
              include: { item: true },
            }),
          ),
        );

        return { ...invoice, invoiceItem: invoiceItems };
      }

      return invoice;
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.CONFLICT);
    }
  }

  async getEntityInvoice(
    entityId: string,
    query: GetInvoicesQueryDto,
  ): Promise<any> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      // Build where clause for filtering
      const whereClause: any = { entityId };
      if (query.status) {
        whereClause.status = query.status;
      }
      if (query.search) {
        whereClause.OR = [
          { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
          {
            customer: { name: { contains: query.search, mode: 'insensitive' } },
          },
        ];
      }

      // Fetch paginated invoices with ALL related data
      const invoices = await this.prisma.invoice.findMany({
        where: whereClause,
        include: {
          customer: { select: { name: true, id: true } },
          invoiceItem: {
            include: {
              item: true,
            },
          },
          // paymentReceived: true,
          // activities: {
          //   orderBy: { createdAt: 'desc' },
          // },
        },
        skip,
        take: Number(limit),
        orderBy: { invoiceDate: 'desc' },
      });

      // Get total count for pagination
      const totalCount = await this.prisma.invoice.count({
        where: whereClause,
      });

      // Fetch stats for all statuses (regardless of filter)
      const [pendingStats, sentStats, paidStats, draftStats, overdueStats] =
        await Promise.all([
          this.getStatusStats(entityId, 'Pending'),
          this.getStatusStats(entityId, 'Sent'),
          this.getStatusStats(entityId, 'Paid'),
          this.getStatusStats(entityId, 'Draft'),
          this.getStatusStats(entityId, 'Overdue'),
        ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        invoices,
        stats: {
          pending: pendingStats,
          sent: sentStats,
          paid: paidStats,
          draft: draftStats,
          overdue: overdueStats,
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

  private async getStatusStats(entityId: string, status: InvoiceStatus) {
    const invoices = await this.prisma.invoice.findMany({
      where: { entityId, status: status as any },
      select: { total: true },
    });

    const count = invoices.length;
    const total = invoices.reduce((sum, inv) => sum + inv.total, 0);

    return { count, total };
  }

  async getPaidInvoices(
    entityId: string,
    query: GetPaidInvoicesQueryDto,
  ): Promise<GetPaidInvoicesResponseDto> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      // Build where clause for filtering
      const whereClause: any = { entityId, status: 'Paid' };
      if (query.search) {
        whereClause.OR = [
          { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
          {
            customer: { name: { contains: query.search, mode: 'insensitive' } },
          },
        ];
      }

      // Fetch paginated paid invoices
      const paidInvoices = await this.prisma.invoice.findMany({
        where: whereClause,
        include: {
          customer: { select: { name: true, id: true } },
          invoiceItem: {
            include: { item: true },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { invoiceDate: 'desc' },
      });

      // Get total count for pagination
      const totalCountFiltered = await this.prisma.invoice.count({
        where: whereClause,
      });

      // Get all paid invoices (without pagination) for stats calculation
      const allPaidInvoices = await this.prisma.invoice.findMany({
        where: { entityId, status: 'Paid' },
        select: { total: true, invoiceDate: true },
      });

      // Calculate total amount and count (all paid invoices)
      const totalPaidAmount = allPaidInvoices.reduce(
        (sum, inv) => sum + inv.total,
        0,
      );
      const totalPaidCount = allPaidInvoices.length;

      // Get current month stats
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonthNum = now.getMonth() + 1;
      const currentMonth = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

      const monthStartDate = new Date(currentYear, currentMonthNum - 1, 1);
      const monthEndDate = new Date(
        currentYear,
        currentMonthNum,
        0,
        23,
        59,
        59,
      );

      const currentMonthInvoices = allPaidInvoices.filter((invoice) => {
        return (
          invoice.invoiceDate >= monthStartDate &&
          invoice.invoiceDate <= monthEndDate
        );
      });

      const currentMonthTotal = currentMonthInvoices.reduce(
        (sum, inv) => sum + inv.total,
        0,
      );
      const currentMonthCount = currentMonthInvoices.length;

      // Transform invoices for response
      const transformedInvoices = paidInvoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customer.name,
        customerId: invoice.customer.id,
        total: invoice.total,
        invoiceDate: invoice.invoiceDate.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
      }));

      const totalPages = Math.ceil(totalCountFiltered / limit);

      return {
        paidInvoices: transformedInvoices,
        totalPaidAmount,
        totalPaidCount,
        currentMonthStats: {
          month: currentMonth,
          total: currentMonthTotal,
          count: currentMonthCount,
        },
        currentMonth,
        totalCountFiltered,
        totalPages,
        currentPage: page,
        limit,
      };
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async getInvoiceById(invoiceId: string, entityId: string) {
    try {
      const invoice = await this.prisma.invoice.findFirst({
        where: { OR: [{ id: invoiceId }, { invoiceNumber: invoiceId }] },
        include: {
          customer: true,
          invoiceItem: {
            include: { item: true },
          },
          paymentReceived: true,
          activities: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!invoice) {
        throw new HttpException('Invoice not found', HttpStatus.NOT_FOUND);
      }

      if (invoice.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to access this invoice',
          HttpStatus.FORBIDDEN,
        );
      }

      return invoice;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async updateInvoice(
    invoiceId: string,
    entityId: string,
    body: UpdateInvoiceDto,
    performedBy?: string,
  ) {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { invoiceItem: true },
      });

      if (!invoice) {
        throw new HttpException('Invoice not found', HttpStatus.NOT_FOUND);
      }

      if (invoice.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to update this invoice',
          HttpStatus.FORBIDDEN,
        );
      }

      // Extract items from body
      const { items, removeItemIds, ...invoiceData } = body;

      // Delete removed items if specified
      if (removeItemIds && removeItemIds.length > 0) {
        await this.prisma.invoiceItem.deleteMany({
          where: {
            id: { in: removeItemIds },
            invoiceId: invoiceId,
          },
        });
      }

      // Handle items update/creation
      if (items && items.length > 0) {
        // Process new/updated items
        for (const item of items) {
          const hasId = (item as any).id && (item as any).id.trim().length > 0;

          if (hasId) {
            // Update existing item (has id)
            await this.prisma.invoiceItem.update({
              where: { id: (item as any).id },
              data: {
                itemId: item.itemId,
                rate: item.rate,
                quantity: item.quantity,
              },
            });
          } else {
            // Create new item (no id provided)
            await this.prisma.invoiceItem.create({
              data: {
                itemId: item.itemId,
                rate: item.rate,
                quantity: item.quantity,
                invoiceId: invoiceId,
              },
            });
          }
        }
      }

      // Update invoice data
      const updatedInvoice = await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: invoiceData,
        include: {
          customer: true,
          invoiceItem: {
            include: { item: true },
          },
          activities: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // Log activity: Invoice Updated
      await this.logInvoiceUpdated(invoiceId, invoiceData, performedBy);

      return updatedInvoice;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteInvoice(
    invoiceId: string,
    entityId: string,
    performedBy?: string,
  ) {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        throw new HttpException('Invoice not found', HttpStatus.NOT_FOUND);
      }

      if (invoice.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to delete this invoice',
          HttpStatus.FORBIDDEN,
        );
      }

      await this.prisma.invoice.delete({
        where: { id: invoiceId },
      });

      // Log activity: Invoice Cancelled
      await this.logInvoiceCancelled(invoiceId, 'Invoice deleted', performedBy);

      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Log invoice sent activity
   */
  async logInvoiceSent(
    invoiceId: string,
    sentTo: string,
    performedBy?: string,
  ) {
    return this.logActivity(
      invoiceId,
      InvoiceActivityType.Sent,
      `Invoice sent to customer${sentTo ? ` (${sentTo})` : ''}`,
      performedBy,
      { sentTo },
    );
  }

  /**
   * Log payment received activity
   */
  async logPaymentReceived(
    invoiceId: string,
    amount: number,
    reference: string,
    performedBy?: string,
  ) {
    return this.logActivity(
      invoiceId,
      InvoiceActivityType.PaymentReceived,
      `Payment received - ${amount}`,
      performedBy,
      { amount, reference },
    );
  }

  /**
   * Log invoice viewed activity
   */
  async logInvoiceViewed(invoiceId: string, viewedBy?: string) {
    return this.logActivity(
      invoiceId,
      InvoiceActivityType.Viewed,
      'Invoice viewed',
      viewedBy,
    );
  }

  /**
   * Log invoice updated activity
   */
  async logInvoiceUpdated(
    invoiceId: string,
    changes: any,
    performedBy?: string,
  ) {
    return this.logActivity(
      invoiceId,
      InvoiceActivityType.Updated,
      'Invoice updated',
      performedBy,
      { changes },
    );
  }

  /**
   * Log invoice overdue activity
   */
  async logInvoiceOverdue(invoiceId: string) {
    return this.logActivity(
      invoiceId,
      InvoiceActivityType.Overdue,
      'Invoice marked as overdue',
    );
  }

  /**
   * Log invoice cancelled activity
   */
  async logInvoiceCancelled(
    invoiceId: string,
    reason?: string,
    performedBy?: string,
  ) {
    return this.logActivity(
      invoiceId,
      InvoiceActivityType.Cancelled,
      `Invoice cancelled${reason ? ` - ${reason}` : ''}`,
      performedBy,
      { reason },
    );
  }
}
