import { PrismaService } from '@/prisma/prisma.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateCustomerDto } from './dto/customer.dto';

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
      const customer = await this.prisma.customer.create({
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
      const [customers, total, active] = await Promise.all([
        this.prisma.customer.findMany({ where: { entityId } }),
        this.prisma.customer.count({ where: { entityId } }),
        this.prisma.customer.count({ where: { entityId, isActive: true } }),
      ]);

      return {
        customers,
        total,
        active,
      };
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }
}
