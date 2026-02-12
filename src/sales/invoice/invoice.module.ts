import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';

@Module({
  imports: [PrismaModule],
  providers: [InvoiceService, AuthService],
  controllers: [InvoiceController],
  exports: [InvoiceService],
})
export class InvoiceModule {}
