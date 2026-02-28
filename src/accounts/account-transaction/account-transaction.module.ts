import { Module } from '@nestjs/common';
import { AccountTransactionService } from './account-transaction.service';
import { AccountTransactionController } from './account-transaction.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';

@Module({
  imports: [PrismaModule],
  controllers: [AccountTransactionController],
  providers: [AccountTransactionService, AuthService],
  exports: [AccountTransactionService],
})
export class AccountTransactionModule {}
