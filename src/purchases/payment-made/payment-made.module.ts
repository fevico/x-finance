import { Module } from '@nestjs/common';
import { PaymentMadeService } from './payment-made.service';
import { PaymentMadeController } from './payment-made.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { BullmqModule } from '@/bullmq/bullmq.module';

@Module({
  imports: [PrismaModule, BullmqModule],
  providers: [PaymentMadeService, AuthService],
  controllers: [PaymentMadeController]
})
export class PaymentMadeModule {}
