import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountService } from '../accounts/account/account.service';
import { OpeningBalanceService } from '../accounts/opening-balance/opening-balance.service';
import { BullmqService } from '../bullmq/bullmq.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Injectable()
export class BankingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountService: AccountService,
    private readonly openingBalanceService: OpeningBalanceService,
    private readonly bullmqService: BullmqService,
  ) {}

  async createBankAccount(
    createBankAccountDto: CreateBankAccountDto,
    effectiveEntityId: any,
  ) {
    // Validate entity exists
    const entity = await this.prisma.entity.findUnique({
      where: { id: effectiveEntityId },
    });

    if (!entity) {
      throw new ForbiddenException('Entity not found');
    }

    // Check if account number already exists for this entity
    const existingAccount = await this.prisma.bankAccount.findFirst({
      where: {
        accountNumber: createBankAccountDto.accountNumber,
        entityId: effectiveEntityId,
      },
    });

    if (existingAccount) {
      throw new BadRequestException('Account number already exists');
    }

    // Find Cash and Cash Equivalents subcategory
    let cashSubCategory = await this.prisma.accountSubCategory.findFirst({
      where: {
        name: 'Cash and Cash Equivalents',
        category: {
          group: {
            entities: {
              some: {
                id: effectiveEntityId,
              },
            },
          },
        },
      },
    });

    if (!cashSubCategory) {
      throw new BadRequestException(
        'Cash and Cash Equivalents subcategory not found',
      );
    }

    // Auto-create linked account with unique code per entity
    const accountCode = await this.generateAccountCode(
      cashSubCategory.code,
      createBankAccountDto.accountName,
      effectiveEntityId,
    );

    const linkedAccount = await this.prisma.account.create({
      data: {
        name: createBankAccountDto.accountName,
        code: accountCode,
        description: `Bank account: ${createBankAccountDto.bankName} (${createBankAccountDto.accountNumber})`,
        entityId: effectiveEntityId,
        subCategoryId: cashSubCategory.id,
        linkedType: 'BANK', // Mark this account as linked to a bank
        balance: 0, // Start at 0, will be updated via opening balance posting
      },
    });

    // Create bank account (metadata only, balance managed through linked Account)
    const bankAccount = await this.prisma.bankAccount.create({
      data: {
        accountName: createBankAccountDto.accountName,
        bankName: createBankAccountDto.bankName,
        accountType: createBankAccountDto.accountType,
        currency: createBankAccountDto.currency,
        accountNumber: createBankAccountDto.accountNumber,
        routingNumber: createBankAccountDto.routingNumber,
        linkedAccountId: linkedAccount.id,
        entityId: effectiveEntityId,
      },
      include: {
        linkedAccount: true,
      },
    });

    // If opening balance is provided, set Account balance and post to journal
    if (createBankAccountDto.openingBalance > 0) {
      // Update linked account balance
      await this.prisma.account.update({
        where: { id: linkedAccount.id },
        data: { balance: createBankAccountDto.openingBalance },
      });

      // Create opening balance record with single item (this bank account)
      const openingBalanceRecord = await this.prisma.openingBalance.create({
        data: {
          entityId: effectiveEntityId,
          date: new Date(),
          // fiscalYear: new Date().getFullYear().toString(),
          totalDebit: createBankAccountDto.openingBalance,
          totalCredit: 0,
          difference: createBankAccountDto.openingBalance,
          status: 'Draft',
          note: `Opening balance for bank account: ${createBankAccountDto.accountName}`,
        },
      });

      // Create opening balance item
      const openingBalanceItem = await this.prisma.openingBalanceItem.create({
        data: {
          openingBalanceId: openingBalanceRecord.id,
          accountId: linkedAccount.id,
          debit: createBankAccountDto.openingBalance,
          credit: 0,
        },
      });

      // Queue opening balance posting to journal (async via BullMQ)
      const accounts = await this.prisma.account.findMany({
        where: {
          id: linkedAccount.id,
          entityId: effectiveEntityId,
        },
        include: {
          subCategory: {
            include: {
              category: {
                include: {
                  type: true,
                },
              },
            },
          },
        },
      });

      const accountMap = new Map(accounts.map((acc) => [acc.id, acc]));

      await this.bullmqService.addJob('post-opening-balance-journal', {
        openingBalanceId: openingBalanceRecord.id,
        entityId: effectiveEntityId,
        items: [openingBalanceItem],
        validItems: [openingBalanceItem],
        accountMap: Array.from(accountMap.entries()).map(([id, acc]) => ({
          id,
          account: acc,
        })),
      });
    }

    // Fetch fresh bankAccount with updated linkedAccount data
    return await this.prisma.bankAccount.findUnique({
      where: { id: bankAccount.id },
      include: {
        linkedAccount: true,
      },
    });
  }

  async getBankAccounts(
    effectiveEntityId: any,
    page: number = 1,
    pageSize: number = 10,
  ) {
    const skip = (page - 1) * pageSize;

    const [bankAccounts, total] = await Promise.all([
      this.prisma.bankAccount.findMany({
        where: {
          entityId: effectiveEntityId,
        },
        include: {
          linkedAccount: true,
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bankAccount.count({
        where: {
          entityId: effectiveEntityId,
        },
      }),
    ]);

    return {
      data: bankAccounts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getBankAccountById(id: string, effectiveEntityId: any) {
    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id },
      include: {
        linkedAccount: true,
      },
    });

    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    if (bankAccount.entityId !== effectiveEntityId) {
      throw new ForbiddenException('Access denied');
    }

    // Get transaction statistics
    const transactions = await this.prisma.accountTransaction.findMany({
      where: {
        accountId: bankAccount.linkedAccountId,
        entityId: effectiveEntityId,
      },
      select: {
        creditAmount: true,
        debitAmount: true,
        status: true,
      },
    });

    const stats = {
      totalDeposits: transactions.reduce((sum, tx) => sum + tx.creditAmount, 0),
      totalWithdrawals: transactions.reduce((sum, tx) => sum + tx.debitAmount, 0),
      pendingCount: transactions.filter((tx) => tx.status === 'Pending').length,
      transactionsCount: transactions.length,
    };

    return {
      ...bankAccount,
      stats,
    };
  }

  async updateBankAccount(
    id: string,
    updateBankAccountDto: UpdateBankAccountDto,
    effectiveEntityId: any,
  ) {
    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id },
    });

    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    if (bankAccount.entityId !== effectiveEntityId) {
      throw new ForbiddenException('Access denied');
    }

    // Check if trying to change account number to one that already exists for this entity
    if (
      updateBankAccountDto.accountNumber &&
      updateBankAccountDto.accountNumber !== bankAccount.accountNumber
    ) {
      const existingAccount = await this.prisma.bankAccount.findFirst({
        where: {
          accountNumber: updateBankAccountDto.accountNumber,
          entityId: effectiveEntityId,
          NOT: { id }, // Exclude current account from check
        },
      });

      if (existingAccount) {
        throw new BadRequestException('Account number already exists');
      }
    }

    const updatedAccount = await this.prisma.bankAccount.update({
      where: { id },
      data: updateBankAccountDto,
      include: {
        linkedAccount: true,
      },
    });

    return updatedAccount;
  }

  async deleteBankAccount(id: string, effectiveEntityId: any) {
    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id },
      include: {
        linkedAccount: {
          include: {
            accountTransactions: true,
          },
        },
      },
    });

    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    if (bankAccount.entityId !== effectiveEntityId) {
      throw new ForbiddenException('Access denied');
    }

    if (bankAccount.linkedAccount.accountTransactions.length > 0) {
      throw new BadRequestException(
        'Cannot delete bank account with existing transactions',
      );
    }

    // Delete linked account if exists
    if (bankAccount.linkedAccountId) {
      await this.prisma.account.delete({
        where: { id: bankAccount.linkedAccountId },
      });
    }

    // Delete bank account
    await this.prisma.bankAccount.delete({
      where: { id },
    });

    return { message: 'Bank account deleted successfully' };
  }

  async addTransaction(
    bankAccountId: string,
    transactionData: {
      date: Date;
      description: string;
      category?: string;
      amount: number;
      type: 'credit' | 'debit';
      reference?: string;
      payee?: string;
      method?: string;
      metadata?: any;
    },
    effectiveEntityId: any,
  ) {
    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
      include: { linkedAccount: true },
    });

    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    if (bankAccount.entityId !== effectiveEntityId) {
      throw new ForbiddenException('Access denied');
    }

    // Calculate new balance from linked account
    const balanceChange =
      transactionData.type === 'credit'
        ? transactionData.amount
        : -transactionData.amount;
    const newBalance = bankAccount.linkedAccount.balance + balanceChange;

    // Create account transaction and update linked account balance
    const [accountTransaction] = await Promise.all([
      this.prisma.accountTransaction.create({
        data: {
          date: transactionData.date,
          description: transactionData.description,
          reference: transactionData.reference,
          type: 'BANK',
          status: 'Success',
          accountId: bankAccount.linkedAccountId,
          debitAmount: transactionData.type === 'debit' ? transactionData.amount : 0,
          creditAmount: transactionData.type === 'credit' ? transactionData.amount : 0,
          runningBalance: newBalance,
          payee: transactionData.payee,
          method: transactionData.method,
          entityId: effectiveEntityId,
          metadata: transactionData.metadata || {},
        },
      }),
      this.prisma.account.update({
        where: { id: bankAccount.linkedAccountId },
        data: {
          balance: newBalance,
        },
      }),
    ]);

    return accountTransaction;
  }

  async getTransactions(
    bankAccountId: string,
    effectiveEntityId: any,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });

    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    if (bankAccount.entityId !== effectiveEntityId) {
      throw new ForbiddenException('Access denied');
    }

    const skip = (page - 1) * pageSize;

    // Query transactions via the linked account
    const [transactions, total] = await Promise.all([
      this.prisma.accountTransaction.findMany({
        where: {
          accountId: bankAccount.linkedAccountId,
          entityId: effectiveEntityId,
        },
        skip,
        take: pageSize,
        orderBy: { date: 'desc' },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      this.prisma.accountTransaction.count({
        where: {
          accountId: bankAccount.linkedAccountId,
          entityId: effectiveEntityId,
        },
      }),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  private async generateAccountCode(
    subCategoryCode: string,
    accountName: string,
    entityId: string,
  ): Promise<string> {
    const sanitizedName = accountName
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 3)
      .toUpperCase();

    let sequence = 1;
    let codeToCheck = `${subCategoryCode}-${sanitizedName}-${String(sequence).padStart(2, '0')}`;

    // Keep incrementing sequence until we find an unused code for this entity
    while (true) {
      const existingAccount = await this.prisma.account.findUnique({
        where: {
          entityId_code: {
            entityId,
            code: codeToCheck,
          },
        },
      });

      if (!existingAccount) {
        // Code is unique for this entity
        return codeToCheck;
      }

      // Code exists, try next sequence
      sequence++;
      codeToCheck = `${subCategoryCode}-${sanitizedName}-${String(sequence).padStart(2, '0')}`;
    }
  }
}
