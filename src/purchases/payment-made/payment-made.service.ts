import { PrismaService } from '@/prisma/prisma.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePaymentMade } from './dto/paymet-made';

@Injectable()
export class PaymentMadeService {
  constructor(private prisma: PrismaService) {}

  async addPaymentMade(body: CreatePaymentMade, entityId: string) {
    const {
      accountId,
      amount,
      billNumber,
      paymentDate,
      vendorId,
      note,
      reference,
      paymentMethod,
    } = body;
    try {
      const paymentMade = await this.prisma.paymentMade.create({
        data: {
          accountId,
          amount,
          billNumber,
          paymentDate,
          vendorId,
          entityId,
          note,
          reference,
          paymentMethod,
        },
      });
      return paymentMade;
    } catch (error) {
      throw new HttpException(
        `${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPaymentMade(entityId: string) {
    try {
      const entityPaymentmade = await this.prisma.paymentMade.findMany({
        where: { entityId },
        include: { vendor: true },
      });
      return entityPaymentmade;
    } catch (error) {
      throw new HttpException(
        `${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
