import { PrismaService } from '@/prisma/prisma.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateVendorDto } from './dto/vendor.dto';

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService) {}

  async createVendor(body: CreateVendorDto, entityId: string) {
    try {
      const vendorExist = await this.prisma.vendor.findUnique({
        where: { email_phone: { email: body.email, phone: body.phone } },
      });
      if (vendorExist) throw new UnauthorizedException('Vendor already exist!');

      // Validate expense account if provided
      if (body.expenseAccountId) {
        const account = await this.prisma.account.findUnique({
          where: { id: body.expenseAccountId },
        });

        if (!account) {
          throw new HttpException(
            'Expense account not found',
            HttpStatus.NOT_FOUND,
          );
        }

        if (account.entityId !== entityId) {
          throw new HttpException(
            'Expense account does not belong to this entity',
            HttpStatus.FORBIDDEN,
          );
        }
      }

      const vendor = await this.prisma.vendor.create({
        data: {
          ...body,
          entityId,
        },
        
      });
      return vendor;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async getVendors(entityId: string, query: any) {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { entityId };
      if (query.type) where.type = query.type;
      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { displayName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      const [vendors, totalCount] = await Promise.all([
        this.prisma.vendor.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            bills: true,
            
          },
        }),
        this.prisma.vendor.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      const transformed = vendors.map((v) => ({
        ...v,
        billsCount: v.bills.length,
        createdAt: v.createdAt.toISOString(),
      }));

      return {
        vendors: transformed,
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
