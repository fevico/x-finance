import { Module, forwardRef } from '@nestjs/common';
import { BankingService } from './banking.service';
import { BankingController } from './banking.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountModule } from '../accounts/account/account.module';
import { OpeningBalanceModule } from '../accounts/opening-balance/opening-balance.module';
import { BullmqModule } from '../bullmq/bullmq.module';
import { AuthService } from '@/auth/auth.service';

@Module({
  imports: [PrismaModule, AccountModule, forwardRef(() => OpeningBalanceModule), forwardRef(() => BullmqModule)],
  providers: [BankingService, AuthService],
  controllers: [BankingController],
})
export class BankingModule {}
