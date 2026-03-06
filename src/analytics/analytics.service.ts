import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  KPIDto,
  MonthlyDataPointDto,
  CashFlowDataPointDto,
  ExpenseCategoryDto,
  AgingBucketDto,
  RecentTransactionDto,
  DashboardResponseDto,
} from './dto/analytics-response.dto';
import { DateFilterEnum, DateFilterHelper, DateRange } from './dto/date-filter.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get unified dashboard data with all metrics
   * @param entityId The entity ID
   * @param monthlyFilter Date filter for monthly breakdown chart
   * @param cashFlowFilter Date filter for cash flow chart
   * @param expensesFilter Date filter for top expenses pie chart
   */
  async getDashboardData(
    entityId: string,
    monthlyFilter: DateFilterEnum = DateFilterEnum.THIS_YEAR,
    cashFlowFilter: DateFilterEnum = DateFilterEnum.LAST_12_MONTHS,
    expensesFilter: DateFilterEnum = DateFilterEnum.THIS_YEAR,
  ): Promise<DashboardResponseDto> {
    try {
      this.logger.debug(
        `[Analytics] Fetching dashboard data for entity: ${entityId} with filters - monthly=${monthlyFilter}, cashFlow=${cashFlowFilter}, expenses=${expensesFilter}`,
      );

      const [
        kpis,
        monthlyBreakdown,
        cashFlow,
        topExpenses,
        receivableAging,
        payableAging,
        recentTransactions,
      ] = await Promise.all([
        this.getKPIs(entityId),
        this.getMonthlyBreakdown(entityId, monthlyFilter),
        this.getCashFlow(entityId, cashFlowFilter),
        this.getTopExpenses(entityId, expensesFilter),
        this.getReceivableAging(entityId),
        this.getPayableAging(entityId),
        this.getRecentTransactions(entityId, 5),
      ]);

      return {
        kpis,
        monthlyBreakdown,
        cashFlow,
        topExpenses,
        receivableAging,
        payableAging,
        recentTransactions,
      };
    } catch (error) {
      this.logger.error(
        `[Analytics] Error fetching dashboard data: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get KPIs: Revenue (MTD), Bank Balance, Current Liabilities, Active Customers
   */
  async getKPIs(entityId: string): Promise<KPIDto> {
    try {
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Revenue (MTD) - Sum of paid invoices + payments received for partial/overdue invoices + receipts
      const currentMTDPaidInvoices = await this.prisma.invoice.aggregate({
        where: {
          entityId,
          status: 'Paid',
          invoiceDate: { gte: currentMonth, lte: now },
        },
        _sum: { total: true },
      });

      // Payments received for Partial invoices in current MTD
      const currentMTDPartialPayments = await this.prisma.paymentReceived.aggregate({
        where: {
          entityId,
          invoice: { status: 'Partial', invoiceDate: { gte: currentMonth, lte: now } },
        },
        _sum: { amount: true },
      });

      // Payments received for Overdue invoices in current MTD
      const currentMTDOverduePayments = await this.prisma.paymentReceived.aggregate({
        where: {
          entityId,
          invoice: { status: 'Overdue', invoiceDate: { gte: currentMonth, lte: now } },
        },
        _sum: { amount: true },
      });

      // Receipts (direct revenue) in current MTD
      const currentMTDReceipts = await this.prisma.receipt.aggregate({
        where: {
          entityId,
          status: 'Completed',
          date: { gte: currentMonth, lte: now },
        },
        _sum: { total: true },
      });

      const revenueMTD =
        (currentMTDPaidInvoices._sum.total || 0) +
        (currentMTDPartialPayments._sum.amount || 0) +
        (currentMTDOverduePayments._sum.amount || 0) +
        (currentMTDReceipts._sum.total || 0);

      // Previous month revenue
      const previousMTDPaidInvoices = await this.prisma.invoice.aggregate({
        where: {
          entityId,
          status: 'Paid',
          invoiceDate: { gte: previousMonth, lte: previousMonthEnd },
        },
        _sum: { total: true },
      });

      // Payments received for Partial invoices in previous month
      const previousMTDPartialPayments = await this.prisma.paymentReceived.aggregate({
        where: {
          entityId,
          invoice: { status: 'Partial', invoiceDate: { gte: previousMonth, lte: previousMonthEnd } },
        },
        _sum: { amount: true },
      });

      // Payments received for Overdue invoices in previous month
      const previousMTDOverduePayments = await this.prisma.paymentReceived.aggregate({
        where: {
          entityId,
          invoice: { status: 'Overdue', invoiceDate: { gte: previousMonth, lte: previousMonthEnd } },
        },
        _sum: { amount: true },
      });

      // Receipts (direct revenue) in previous month
      const previousMTDReceipts = await this.prisma.receipt.aggregate({
        where: {
          entityId,
          status: 'Completed',
          date: { gte: previousMonth, lte: previousMonthEnd },
        },
        _sum: { total: true },
      });

      const revenuePrevious =
        (previousMTDPaidInvoices._sum.total || 0) +
        (previousMTDPartialPayments._sum.amount || 0) +
        (previousMTDOverduePayments._sum.amount || 0) +
        (previousMTDReceipts._sum.total || 0);

      const revenueChange = revenueMTD - revenuePrevious;
      const revenueChangePercent =
        revenuePrevious > 0 ? (revenueChange / revenuePrevious) * 100 : 100;

      // Bank Balance (Total across all linked bank accounts)
      const bankAccounts = await this.prisma.bankAccount.findMany({
        where: { entityId },
        include: { linkedAccount: { select: { balance: true } } },
      });

      const currentBankBalance = bankAccounts.reduce((sum, a) => sum + a.linkedAccount.balance, 0);

      // Get previous month-end balance from the last transaction on or before previous month end
      const lastTransactionPreviousMonth = await this.prisma.accountTransaction.findFirst({
        where: {
          entityId,
          type: 'BANK',
          date: { lte: previousMonthEnd },
        },
        orderBy: { date: 'desc' },
        select: { runningBalance: true },
      });

      // If no transactions exist, use 0; otherwise use the running balance from last transaction
      const previousBankBalance = lastTransactionPreviousMonth?.runningBalance || 0;

      const bankBalanceChange = currentBankBalance - previousBankBalance;
      const bankBalanceChangePercent =
        previousBankBalance > 0 ? (bankBalanceChange / previousBankBalance) * 100 : 100;

      // Current Liabilities (Unpaid Bills)
      const unpaidBills = await this.prisma.bills.aggregate({
        where: {
          entityId,
          status: { in: ['unpaid', 'partial'] },
        },
        _sum: { total: true },
      });

      const currentLiabilities = unpaidBills._sum.total || 0;

      // Get all unpaid/partial bills as of previous period for consistent comparison
      const previousUnpaidBills = await this.prisma.bills.aggregate({
        where: {
          entityId,
          status: { in: ['unpaid', 'partial'] },
        },
        _sum: { total: true },
      });

      const previousLiabilities = previousUnpaidBills._sum.total || 0;
      const liabilitiesChange = currentLiabilities - previousLiabilities;
      const liabilitiesChangePercent =
        previousLiabilities > 0 ? (liabilitiesChange / previousLiabilities) * 100 : 0;

      // Active Customers
      const [activeCustomers, totalCustomers] = await Promise.all([
        this.prisma.customer.count({
          where: { entityId, isActive: true },
        }),
        this.prisma.customer.count({
          where: { entityId },
        }),
      ]);

      const previousActiveCustomers = await this.prisma.customer.count({
        where: {
          entityId,
          isActive: true,
          createdAt: { lte: previousMonthEnd },
        },
      });

      const customersChange = activeCustomers - previousActiveCustomers;
      const customersChangePercent =
        previousActiveCustomers > 0 ? (customersChange / previousActiveCustomers) * 100 : 100;

      return {
        revenue: {
          mtd: revenueMTD,
          change: revenueChange,
          changePercent: revenueChangePercent,
        },
        bankBalance: {
          total: currentBankBalance,
          change: bankBalanceChange,
          changePercent: bankBalanceChangePercent,
        },
        liabilities: {
          total: currentLiabilities,
          change: liabilitiesChange,
          changePercent: liabilitiesChangePercent,
        },
        activeCustomers: {
          count: activeCustomers,
          change: customersChange,
          changePercent: customersChangePercent,
        },
      };
    } catch (error) {
      this.logger.error(`[Analytics] Error calculating KPIs: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get monthly revenue and expenses breakdown with date filtering
   * @param entityId The entity ID
   * @param filter Date filter type (THIS_YEAR, THIS_FISCAL_YEAR, LAST_FISCAL_YEAR, LAST_12_MONTHS)
   */
  async getMonthlyBreakdown(
    entityId: string,
    filter: DateFilterEnum = DateFilterEnum.THIS_YEAR,
  ): Promise<MonthlyDataPointDto[]> {
    try {
      const dateRange = DateFilterHelper.getDateRange(filter);
      const monthlyData: MonthlyDataPointDto[] = [];

      // Calculate months between start and end date
      let current = new Date(dateRange.startDate);
      current.setDate(1); // Start from first day of month

      while (current <= dateRange.endDate) {
        const start = new Date(current);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);

        // Don't include months beyond the filter's end date
        if (start > dateRange.endDate) break;

        const month = start.toLocaleString('default', { month: 'short' });
        const year = start.getFullYear();
        const monthLabel = `${month} '${year.toString().slice(-2)}`;

        // Revenue: Sum of paid invoices + payments received for partial/overdue invoices + receipts
        const endDate = end > dateRange.endDate ? dateRange.endDate : end;
        const [paidInvoices, partialPayments, overduePayments, receipts] = await Promise.all([
          this.prisma.invoice.aggregate({
            where: {
              entityId,
              status: 'Paid',
              invoiceDate: { gte: start, lte: endDate },
            },
            _sum: { total: true },
          }),
          this.prisma.paymentReceived.aggregate({
            where: {
              entityId,
              invoice: { status: 'Partial', invoiceDate: { gte: start, lte: endDate } },
            },
            _sum: { amount: true },
          }),
          this.prisma.paymentReceived.aggregate({
            where: {
              entityId,
              invoice: { status: 'Overdue', invoiceDate: { gte: start, lte: endDate } },
            },
            _sum: { amount: true },
          }),
          this.prisma.receipt.aggregate({
            where: {
              entityId,
              status: 'Completed',
              date: { gte: start, lte: endDate },
            },
            _sum: { total: true },
          }),
        ]);

        const revenue =
          (paidInvoices._sum.total || 0) +
          (partialPayments._sum.amount || 0) +
          (overduePayments._sum.amount || 0) +
          (receipts._sum.total || 0);

        // Expenses: Sum of approved expenses + paid bills
        const [expenses, bills] = await Promise.all([
          this.prisma.expenses.aggregate({
            where: {
              entityId,
              status: 'approved',
              createdAt: { gte: start, lte: endDate },
            },
            _sum: { amount: true },
          }),
          this.prisma.paymentMade.aggregate({
            where: {
              entityId,
              paymentDate: { gte: start, lte: endDate },
            },
            _sum: { amount: true },
          }),
        ]);

        monthlyData.push({
          month: monthLabel,
          revenue,
          expenses: (expenses._sum?.amount || 0) + (bills._sum?.amount || 0),
        });

        // Move to next month
        current.setMonth(current.getMonth() + 1);
      }

      return monthlyData;
    } catch (error) {
      this.logger.error(
        `[Analytics] Error calculating monthly breakdown: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get cash flow: Inflow vs Outflow by month with date filtering
   * @param entityId The entity ID
   * @param filter Date filter type (THIS_YEAR, THIS_FISCAL_YEAR, LAST_FISCAL_YEAR, LAST_12_MONTHS)
   */
  async getCashFlow(
    entityId: string,
    filter: DateFilterEnum = DateFilterEnum.LAST_12_MONTHS,
  ): Promise<CashFlowDataPointDto[]> {
    try {
      const dateRange = DateFilterHelper.getDateRange(filter);
      const cashFlowData: CashFlowDataPointDto[] = [];

      // Calculate months between start and end date
      let current = new Date(dateRange.startDate);
      current.setDate(1); // Start from first day of month

      while (current <= dateRange.endDate) {
        const start = new Date(current);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);

        // Don't include months beyond the filter's end date
        if (start > dateRange.endDate) break;

        const month = start.toLocaleString('default', { month: 'short' });
        const year = start.getFullYear();
        const monthLabel = `${month} '${year.toString().slice(-2)}`;

        // Inflow: Paid invoices + Payment received for Partial/Overdue invoices + Completed receipts
        const endDateInflow = end > dateRange.endDate ? dateRange.endDate : end;
        const [invoicesInflow, partialPaymentsInflow, overduePaymentsInflow, receiptsInflow] = await Promise.all([
          this.prisma.invoice.aggregate({
            where: {
              entityId,
              status: 'Paid',
              invoiceDate: { gte: start, lte: endDateInflow },
            },
            _sum: { total: true },
          }),
          this.prisma.paymentReceived.aggregate({
            where: {
              entityId,
              invoice: { status: 'Partial', invoiceDate: { gte: start, lte: endDateInflow } },
            },
            _sum: { amount: true },
          }),
          this.prisma.paymentReceived.aggregate({
            where: {
              entityId,
              invoice: { status: 'Overdue', invoiceDate: { gte: start, lte: endDateInflow } },
            },
            _sum: { amount: true },
          }),
          this.prisma.receipt.aggregate({
            where: {
              entityId,
              status: 'Completed',
              date: { gte: start, lte: endDateInflow },
            },
            _sum: { total: true },
          }),
        ]);

        const inflow =
          (invoicesInflow._sum.total || 0) +
          (partialPaymentsInflow._sum.amount || 0) +
          (overduePaymentsInflow._sum.amount || 0) +
          (receiptsInflow._sum.total || 0);

        // Outflow: Approved expenses + Bill payments
        const endDateOutflow = end > dateRange.endDate ? dateRange.endDate : end;
        const [expensesOutflow, billPayments] = await Promise.all([
          this.prisma.expenses.aggregate({
            where: {
              entityId,
              status: 'approved',
              createdAt: { gte: start, lte: endDateOutflow },
            },
            _sum: { amount: true },
          }),
          this.prisma.paymentMade.aggregate({
            where: {
              entityId,
              paymentDate: { gte: start, lte: endDateOutflow },
            },
            _sum: { amount: true },
          }),
        ]);

        const outflow =
          (expensesOutflow._sum?.amount || 0) +
          (billPayments._sum?.amount || 0);

        cashFlowData.push({ month: monthLabel, inflow, outflow });

        // Move to next month
        current.setMonth(current.getMonth() + 1);
      }

      return cashFlowData;
    } catch (error) {
      this.logger.error(
        `[Analytics] Error calculating cash flow: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get top expenses by category with date filtering
   * Includes both approved expenses and bill payments categorized by their expense accounts
   * @param entityId The entity ID
   * @param filter Date filter type (THIS_YEAR, THIS_FISCAL_YEAR, LAST_FISCAL_YEAR, LAST_12_MONTHS)
   * @param limit Maximum number of categories to return
   */
  async getTopExpenses(
    entityId: string,
    filter: DateFilterEnum = DateFilterEnum.THIS_YEAR,
    limit: number = 10,
  ): Promise<ExpenseCategoryDto[]> {
    try {
      const dateRange = DateFilterHelper.getDateRange(filter);

      // Fetch expenses with their linked account info
      const allExpenses = await this.prisma.expenses.findMany({
        where: {
          entityId,
          status: 'approved',
          createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
        },
        include: {
          expenseAccount: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      // Fetch bills with their items to extract expense account breakdown
      const allBillPayments = await this.prisma.paymentMade.findMany({
        where: {
          entityId,
          paymentDate: { gte: dateRange.startDate, lte: dateRange.endDate },
        },
        include: {
          bill: {
            select: { items: true },
          },
        },
      });

      // Group by expense account and sum amounts
      const expensesByAccount = new Map<string, { name: string; accountId: string; total: number }>();

      // Add approved expenses
      allExpenses.forEach((exp) => {
        const accountKey = exp.expenseAccountId;
        const accountName = exp.expenseAccount?.name || 'Uncategorized';
        const existing = expensesByAccount.get(accountKey);
        expensesByAccount.set(accountKey, {
          name: accountName,
          accountId: accountKey,
          total: (existing?.total || 0) + exp.amount,
        });
      });

      // Add bill payments by their line item expense accounts
      allBillPayments.forEach((payment) => {
        if (payment.bill?.items && Array.isArray(payment.bill.items)) {
          // Parse bill items to distribute payment across expense accounts
          const items = payment.bill.items as Array<{
            expenseAccountId?: string;
            accountId?: string;
            name?: string;
            total?: number;
          }>;

          // Calculate total amount in bill items for proportional distribution
          const totalItemAmount = items.reduce((sum, item) => sum + (item.total || 0), 0);

          if (totalItemAmount > 0) {
            // Distribute payment proportionally across items
            items.forEach((item) => {
              const expenseAccountId = item.expenseAccountId || item.accountId;
              if (expenseAccountId) {
                const proportion = (item.total || 0) / totalItemAmount;
                const allocatedAmount = Math.round(payment.amount * proportion);
                const accountKey = expenseAccountId;
                const accountName = item.name || 'Uncategorized';
                const existing = expensesByAccount.get(accountKey);
                expensesByAccount.set(accountKey, {
                  name: accountName,
                  accountId: accountKey,
                  total: (existing?.total || 0) + allocatedAmount,
                });
              }
            });
          }
        }
      });

      // Sort by amount descending and take limit
      const sorted = Array.from(expensesByAccount.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);

      const totalExpenses = sorted.reduce((sum, e) => sum + e.total, 0);

      return sorted.map((exp) => ({
        category: exp.name,
        categoryId: exp.accountId,
        amount: exp.total,
        percentage: totalExpenses > 0 ? (exp.total / totalExpenses) * 100 : 0,
      }));
    } catch (error) {
      this.logger.error(
        `[Analytics] Error calculating top expenses: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get accounts receivable aging (based on invoice aging)
   * Includes Sent, Overdue, and Partial invoices
   */
  async getReceivableAging(entityId: string): Promise<AgingBucketDto> {
    try {
      const now = new Date();

      const unpaidInvoices = await this.prisma.invoice.findMany({
        where: {
          entityId,
          status: { in: ['Sent', 'Overdue', 'Partial'] },
        },
        select: {
          total: true,
          invoiceDate: true,
        },
      });

      const aging: AgingBucketDto = {
        '0-30': 0,
        '31-60': 0,
        '61-90': 0,
        '90+': 0,
      };

      unpaidInvoices.forEach((invoice) => {
        const ageInMs = now.getTime() - new Date(invoice.invoiceDate).getTime();
        const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));

        if (ageInDays <= 30) {
          aging['0-30'] += invoice.total;
        } else if (ageInDays <= 60) {
          aging['31-60'] += invoice.total;
        } else if (ageInDays <= 90) {
          aging['61-90'] += invoice.total;
        } else {
          aging['90+'] += invoice.total;
        }
      });

      return aging;
    } catch (error) {
      this.logger.error(
        `[Analytics] Error calculating receivable aging: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get accounts payable aging (based on bill due dates)
   */
  async getPayableAging(entityId: string): Promise<AgingBucketDto> {
    try {
      const now = new Date();

      const unpaidBills = await this.prisma.bills.findMany({
        where: {
          entityId,
          status: { in: ['unpaid', 'partial'] },
        },
        select: {
          total: true,
          dueDate: true,
        },
      });

      const aging: AgingBucketDto = {
        '0-30': 0,
        '31-60': 0,
        '61-90': 0,
        '90+': 0,
      };

      unpaidBills.forEach((bill) => {
        const ageInMs = now.getTime() - new Date(bill.dueDate).getTime();
        const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));

        if (ageInDays <= 30) {
          aging['0-30'] += bill.total;
        } else if (ageInDays <= 60) {
          aging['31-60'] += bill.total;
        } else if (ageInDays <= 90) {
          aging['61-90'] += bill.total;
        } else {
          aging['90+'] += bill.total;
        }
      });

      return aging;
    } catch (error) {
      this.logger.error(
        `[Analytics] Error calculating payable aging: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get recent transactions (latest activity)
   */
  async getRecentTransactions(
    entityId: string,
    limit: number = 10,
  ): Promise<RecentTransactionDto[]> {
    try {
      const transactions = await this.prisma.accountTransaction.findMany({
        where: { entityId, type: 'BANK' },
        include: {
          account: { select: { code: true, name: true } },
        },
        orderBy: { date: 'desc' },
        take: limit,
      });

      return transactions.map((tx) => ({
        id: tx.id,
        date: tx.date,
        description: tx.description,
        reference: tx.reference || '',
        type: tx.type,
        debit: tx.debitAmount,
        credit: tx.creditAmount,
        amount: Math.max(tx.debitAmount, tx.creditAmount),
        status: tx.status,
      }));
    } catch (error) {
      this.logger.error(
        `[Analytics] Error fetching recent transactions: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get banking summary: total bank cash and number of accounts
   */
  async getBankingSummary(entityId: string) {
    try {
      const bankAccounts = await this.prisma.bankAccount.findMany({
        where: { entityId },
        select: {
          id: true,
          accountName: true,
          bankName: true,
          accountType: true,
          currency: true,
          status: true,
          linkedAccount: {
            select: {
              balance: true,
            },
          },
        },
        orderBy: { accountName: 'asc' },
      });

      const totalBankCash = bankAccounts.reduce(
        (sum, account) => sum + account.linkedAccount.balance,
        0,
      );
      const numberOfBankAccounts = bankAccounts.length;

      return {
        totalBankCash,
        numberOfBankAccounts,
        accounts: bankAccounts,
      };
    } catch (error) {
      this.logger.error(
        `[Analytics] Error fetching banking summary: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
