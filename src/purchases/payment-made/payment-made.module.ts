import { Module } from '@nestjs/common';
import { PaymentMadeService } from './payment-made.service';
import { PaymentMadeController } from './payment-made.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PaymentMadeService],
  controllers: [PaymentMadeController]
})
export class PaymentMadeModule {}
