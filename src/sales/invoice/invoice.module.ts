import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { BullmqModule } from '@/bullmq/bullmq.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot(), BullmqModule],
  providers: [InvoiceService, AuthService],
  controllers: [InvoiceController],
  exports: [InvoiceService],
})
export class InvoiceModule {}
