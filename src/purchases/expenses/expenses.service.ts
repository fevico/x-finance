import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateExpenseDto } from './dto/expense.dto';
import { GetExpensesQueryDto } from './dto/get-expenses-query.dto';
import { FileuploadService } from '@/fileupload/fileupload.service';
import { generateRandomInvoiceNumber } from '@/auth/utils/helper';

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private fileuploadService: FileuploadService,
  ) {}

  async createExpense(
    body: CreateExpenseDto,
    entityId: string,
    file?: Express.Multer.File,
  ) {
    try {
      let attachment: any = undefined;

      const vendor = await this.prisma.vendor.findUnique({
        where: { id: body.vendorId },
      });

      if (!vendor) {
        throw new HttpException('Vendor not found', HttpStatus.NOT_FOUND);
      }

      if (vendor.entityId !== entityId) {
        throw new HttpException(
          'Vendor does not belong to this entity',
          HttpStatus.FORBIDDEN,
        );
      }

      const resolvedAccountId = body.accountId;
      if (!resolvedAccountId) {
        throw new HttpException(
          'Expense account is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate account exists and belongs to the same entity
      const account = await this.prisma.account.findUnique({
        where: { id: resolvedAccountId },
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

      // Upload file to Cloudinary if provided
      if (file) {
        attachment = await this.fileuploadService.uploadFile(
          file,
          `expenses/${entityId}`,
        );
      }

      const reference = generateRandomInvoiceNumber({ prefix: 'EXP' });

      const expense = await this.prisma.expenses.create({
        data: {
          ...body,
          accountId: resolvedAccountId,
          reference,
          entityId,
          vendorId: body.vendorId,
          attachment: attachment
            ? { publicId: attachment.publicId, secureUrl: attachment.secureUrl }
            : undefined,
        },
        include: {
          account: {
            select: { id: true, name: true, code: true },
          },
          vendor: {
            select: { id: true, name: true },
          },
        },
      });
      return expense;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async getExpenses(entityId: string, query: GetExpensesQueryDto) {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { entityId };
      if (query.category) where.category = query.category;
      if (query.search) {
        where.OR = [
          { reference: { contains: query.search, mode: 'insensitive' } },
          { supplier: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      const [expenses, totalCount] = await Promise.all([
        this.prisma.expenses.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { date: 'desc' },
          include: {
            account: {
              select: { id: true, name: true, code: true },
            },
            vendor: {
              select: { id: true, name: true },
            },
          },
        }),
        this.prisma.expenses.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      const transformed = expenses.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
        date: e.date.toISOString(),
      }));

      return {
        expenses: transformed,
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      };
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async approveExpense(expenseId: string, entityId: string) {
    try {
      const expense = await this.prisma.expenses.findUnique({
        where: { id: expenseId },
      });

      if (!expense) {
        throw new HttpException('Expense not found', HttpStatus.NOT_FOUND);
      }

      if (expense.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to approve this expense',
          HttpStatus.FORBIDDEN,
        );
      }

      if (expense.status !== 'pending') {
        throw new HttpException(
          `Cannot approve expense with status: ${expense.status}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const updatedExpense = await this.prisma.expenses.update({
        where: { id: expenseId },
        data: { status: 'approved' },
        include: {
          account: {
            select: { id: true, name: true, code: true },
          },
          vendor: {
            select: { id: true, name: true },
          },
        },
      });

      return updatedExpense;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async updateExpense(
    expenseId: string,
    entityId: string,
    body: any,
    file?: Express.Multer.File,
  ) {
    try {
      const expense = await this.prisma.expenses.findUnique({
        where: { id: expenseId },
      });

      if (!expense) {
        throw new HttpException('Expense not found', HttpStatus.NOT_FOUND);
      }

      if (expense.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to update this expense',
          HttpStatus.FORBIDDEN,
        );
      }

      let resolvedAccountId = body.accountId ?? expense.accountId;

      if (body.vendorId) {
        const vendor = await this.prisma.vendor.findUnique({
          where: { id: body.vendorId },
        });

        if (!vendor) {
          throw new HttpException('Vendor not found', HttpStatus.NOT_FOUND);
        }

        if (vendor.entityId !== entityId) {
          throw new HttpException(
            'Vendor does not belong to this entity',
            HttpStatus.FORBIDDEN,
          );
        }

        // if (!body.accountId) {
        //  return 
        // }
      }

      if (!resolvedAccountId) {
        throw new HttpException(
          'Expense account is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate account if changed or resolved from vendor
      if (resolvedAccountId !== expense.accountId || body.accountId) {
        const account = await this.prisma.account.findUnique({
          where: { id: resolvedAccountId },
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

      let attachment = expense.attachment as any;

      // Upload new file if provided
      if (file) {
        // Delete old attachment if exists
        if (attachment?.publicId) {
          await this.fileuploadService.deleteFile(attachment.publicId);
        }

        const uploadedFile = await this.fileuploadService.uploadFile(
          file,
          `expenses/${entityId}`,
        );
        attachment = {
          publicId: uploadedFile.publicId,
          secureUrl: uploadedFile.secureUrl,
        };
      }

      const updatedExpense = await this.prisma.expenses.update({
        where: { id: expenseId },
        data: {
          ...body,
          accountId: resolvedAccountId,
          ...(file && { attachment }),
        },
        include: {
          account: {
            select: { id: true, name: true, code: true },
          },
          vendor: {
            select: { id: true, name: true },
          },
        },
      });

      return updatedExpense;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteExpense(expenseId: string, entityId: string) {
    try {
      const expense = await this.prisma.expenses.findUnique({
        where: { id: expenseId },
      });

      if (!expense) {
        throw new HttpException('Expense not found', HttpStatus.NOT_FOUND);
      }

      if (expense.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to delete this expense',
          HttpStatus.FORBIDDEN,
        );
      }

      // Delete attachment from Cloudinary if exists
      const attachment = expense.attachment as any;
      if (attachment?.publicId) {
        await this.fileuploadService.deleteFile(attachment.publicId);
      }

      await this.prisma.expenses.delete({
        where: { id: expenseId },
      });

      return { message: 'Expense deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }
}
