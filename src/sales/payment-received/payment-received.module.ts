import { Module } from '@nestjs/common';
import { PaymentReceivedService } from './payment-received.service';
import { PaymentReceivedController } from './payment-received.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { InvoiceModule } from '../invoice/invoice.module';

@Module({
  imports: [PrismaModule, InvoiceModule],
  providers: [PaymentReceivedService, AuthService],
  controllers: [PaymentReceivedController],
})
export class PaymentReceivedModule {}
