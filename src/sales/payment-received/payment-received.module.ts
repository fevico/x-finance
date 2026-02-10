import { Module } from '@nestjs/common';
import { PaymentReceivedService } from './payment-received.service';
import { PaymentReceivedController } from './payment-received.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';

@Module({
  imports: [PrismaModule],
  providers: [PaymentReceivedService, AuthService],
  controllers: [PaymentReceivedController]
})
export class PaymentReceivedModule {}
