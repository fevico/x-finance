import { PrismaService } from '@/prisma/prisma.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async createCustomer(body: CreateCustomerDto, entityId: string) {
    try {
      const customerExist = await this.prisma.customer.findUnique({
        where: { email: body.email },
      });
      if (customerExist)
        throw new UnauthorizedException('Customer already exist!');
      return await this.prisma.customer.create({
        data: {
          ...body,
          entityId,
        },
      });
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async getAllCustomer(entityId: string) {
    try {
      const [customersRaw, total, active] = await Promise.all([
        this.prisma.customer.findMany({
          where: { entityId },
          include: { _count: { select: { invoice: true } } },
        }),
        this.prisma.customer.count({ where: { entityId } }),
        this.prisma.customer.count({ where: { entityId, isActive: true } }),
      ]);

      const customers = customersRaw.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phoneNumber: c.phoneNumber,
        companyName: c.companyName,
        isActive: c.isActive,
        createdAt: c.createdAt,
        invoiceCount: c._count?.invoice ?? 0,
      }));

      return {
        customers,
        total,
        active,
        averageBalance: 0,
        outstandinReceivables: 0,
      };
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async updateCustomer(body: UpdateCustomerDto, entityId: string) {
    try {
      const customer = await this.prisma.customer.findFirst({
        where: { id: body.customerId, entityId },
      });
      if (!customer)
        throw new UnauthorizedException(
          'Customer not found or does not belong to this entity!',
        );
      const updateEntityCustomer = await this.prisma.customer.update({
        where: { id: body.customerId, entityId },
        data: { ...body },
      });
      return updateEntityCustomer;
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async getCustomerById(customerId: string, entityId: string) {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        include: { invoice: true },
      });

      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }

      if (customer.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to access this customer',
          HttpStatus.FORBIDDEN,
        );
      }

      return customer;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteCustomer(customerId: string, entityId: string) {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
      });
      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }
      if (customer.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to delete this customer',
          HttpStatus.FORBIDDEN,
        );
      }

      // Delete invoices first, then customer to avoid FK issues
      await this.prisma.$transaction([
        this.prisma.invoice.deleteMany({ where: { customerId } }),
        this.prisma.customer.delete({ where: { id: customerId } }),
      ]);

      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }
}
