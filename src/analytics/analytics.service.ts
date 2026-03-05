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

      // Revenue (MTD)
      const currentMTDRevenue = await this.prisma.invoice.aggregate({
        where: {
          entityId,
          status: 'Paid',
          invoiceDate: { gte: currentMonth, lte: now },
        },
        _sum: { total: true },
      });

      const previousMTDRevenue = await this.prisma.invoice.aggregate({
        where: {
          entityId,
          status: 'Paid',
          invoiceDate: { gte: previousMonth, lte: previousMonthEnd },
        },
        _sum: { total: true },
      });

      const revenueMTD = currentMTDRevenue._sum.total || 0;
      const revenuePrevious = previousMTDRevenue._sum.total || 0;
      const revenueChange = revenueMTD - revenuePrevious;
      const revenueChangePercent =
        revenuePrevious > 0 ? (revenueChange / revenuePrevious) * 100 : 100;

      // Bank Balance (Total across all accounts)
      const bankAccounts = await this.prisma.bankAccount.findMany({
        where: { entityId },
        select: { currentBalance: true },
      });

      const currentBankBalance = bankAccounts.reduce((sum, a) => sum + a.currentBalance, 0);

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

      const previousUnpaidBills = await this.prisma.bills.aggregate({
        where: {
          entityId,
          status: { in: ['unpaid', 'partial'] },
          billDate: { lte: previousMonthEnd },
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

        // Revenue: Sum of paid invoices
        const endDate = end > dateRange.endDate ? dateRange.endDate : end;
        const revenue = await this.prisma.invoice.aggregate({
          where: {
            entityId,
            status: 'Paid',
            invoiceDate: { gte: start, lte: endDate },
          },
          _sum: { total: true },
        });

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
          revenue: revenue._sum.total || 0,
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

        // Inflow: Paid invoices + Payment received + Receipts
        const endDateInflow = end > dateRange.endDate ? dateRange.endDate : end;
        const [invoicesInflow, receiptsInflow] = await Promise.all([
          this.prisma.invoice.aggregate({
            where: {
              entityId,
              status: 'Paid',
              invoiceDate: { gte: start, lte: endDateInflow },
            },
            _sum: { total: true },
          }),
          this.prisma.receipt.aggregate({
            where: {
              entityId,
              createdAt: { gte: start, lte: endDateInflow },
            },
            _sum: { total: true },
          }),
        ]);

        const inflow = (invoicesInflow._sum.total || 0) + (receiptsInflow._sum.total || 0);

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
   * Note: Grouping by vendor since Expenses model doesn't have category field
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

      // Group by expense account and sum amounts
      const expensesByAccount = new Map<string, { name: string; accountId: string; total: number }>();
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
   */
  async getReceivableAging(entityId: string): Promise<AgingBucketDto> {
    try {
      const now = new Date();

      const unpaidInvoices = await this.prisma.invoice.findMany({
        where: {
          entityId,
          status: { in: ['Sent', 'Overdue'] },
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
          currentBalance: true,
          status: true,
        },
        orderBy: { accountName: 'asc' },
      });

      const totalBankCash = bankAccounts.reduce(
        (sum, account) => sum + account.currentBalance,
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
