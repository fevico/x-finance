import { Module } from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { ReceiptController } from './receipt.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';

@Module({
  imports:[PrismaModule],
  providers: [ReceiptService, AuthService],
  controllers: [ReceiptController]
})
export class ReceiptModule {}
