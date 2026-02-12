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

      // Upload file to Cloudinary if provided
      if (file) {
        attachment = await this.fileuploadService.uploadFile(
          file,
          `expenses/${entityId}`,
        );
      }

      const reference = generateRandomInvoiceNumber({prefix: 'EXP'});

      const expense = await this.prisma.expenses.create({
        data: {
          ...body,
          reference,
          entityId,
          attachment: attachment
            ? { publicId: attachment.publicId, secureUrl: attachment.secureUrl }
            : undefined,
        },
      });
      return expense;
    } catch (error) {
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
}
