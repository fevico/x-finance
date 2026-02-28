import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountService } from '../accounts/account/account.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Injectable()
export class BankingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountService: AccountService,
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

    // Check if account number already exists
    const existingAccount = await this.prisma.bankAccount.findUnique({
      where: { accountNumber: createBankAccountDto.accountNumber },
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

    // Auto-create linked account
    const accountCode = this.generateAccountCode(
      cashSubCategory.code,
      createBankAccountDto.accountName,
    );

    const linkedAccount = await this.prisma.account.create({
      data: {
        name: createBankAccountDto.accountName,
        code: accountCode,
        description: `Bank account: ${createBankAccountDto.bankName} (${createBankAccountDto.accountNumber})`,
        entityId: effectiveEntityId,
        subCategoryId: cashSubCategory.id,
        balance: createBankAccountDto.openingBalance,
      },
    });

    // Create bank account
    const bankAccount = await this.prisma.bankAccount.create({
      data: {
        ...createBankAccountDto,
        linkedAccountId: linkedAccount.id,
        entityId: effectiveEntityId,
        currentBalance: createBankAccountDto.openingBalance,
      },
      include: {
        linkedAccount: true,
      },
    });

    return bankAccount;
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
          accountTransactions: {
            orderBy: { date: 'desc' },
            take: 5,
          },
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
        accountTransactions: {
          orderBy: { date: 'desc' },
          take: 20,
        },
      },
    });

    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    if (bankAccount.entityId !== effectiveEntityId) {
      throw new ForbiddenException('Access denied');
    }

    return bankAccount;
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

    // Check if trying to change account number to one that already exists
    if (
      updateBankAccountDto.accountNumber &&
      updateBankAccountDto.accountNumber !== bankAccount.accountNumber
    ) {
      const existingAccount = await this.prisma.bankAccount.findUnique({
        where: { accountNumber: updateBankAccountDto.accountNumber },
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
        accountTransactions: true,
      },
    });

    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    if (bankAccount.entityId !== effectiveEntityId) {
      throw new ForbiddenException('Access denied');
    }

    if (bankAccount.accountTransactions.length > 0) {
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

    // Calculate new balance
    const balanceChange =
      transactionData.type === 'credit'
        ? transactionData.amount
        : -transactionData.amount;
    const newBalance = bankAccount.currentBalance + balanceChange;

    // Create account transaction record
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
          bankAccountId: bankAccountId,
          metadata: transactionData.metadata || {},
        },
      }),
      this.prisma.bankAccount.update({
        where: { id: bankAccountId },
        data: {
          currentBalance: newBalance,
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

    const [transactions, total] = await Promise.all([
      this.prisma.accountTransaction.findMany({
        where: {
          bankAccountId,
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
          bankAccountId,
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

  private generateAccountCode(
    subCategoryCode: string,
    accountName: string,
  ): string {
    // Generate a unique code based on subcategory and account name
    // Format: {subCategoryCode}-{sequence}
    const sanitizedName = accountName
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 3)
      .toUpperCase();
    return `${subCategoryCode}-${sanitizedName}-01`;
  }
}
