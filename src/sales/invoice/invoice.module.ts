import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { BullmqModule } from '@/bullmq/bullmq.module';
import { BankingService } from '@/banking/banking.service';
import { AccountService } from '@/accounts/account/account.service';
import { OpeningBalanceService } from '@/accounts/opening-balance/opening-balance.service';
import { PdfService } from '@/pdf/pdf.service';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot(), BullmqModule],
  providers: [InvoiceService, AuthService, BankingService, AccountService, OpeningBalanceService, PdfService],
  controllers: [InvoiceController],
  exports: [InvoiceService],
})
export class InvoiceModule {}
