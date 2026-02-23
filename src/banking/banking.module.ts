import { Module } from '@nestjs/common';
import { BankingService } from './banking.service';
import { BankingController } from './banking.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountModule } from '../accounts/account/account.module';
import { AuthService } from '@/auth/auth.service';

@Module({
  imports: [PrismaModule, AccountModule],
  providers: [BankingService, AuthService],
  controllers: [BankingController],
})
export class BankingModule {}
