import { Module } from '@nestjs/common';
import { AccountTransactionService } from './account-transaction.service';
import { AccountTransactionController } from './account-transaction.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { CacheService } from '@/cache/cache.service';
import { SubscriptionService } from '@/subscription/subscription.service';
import { MenuService } from '@/menu/menu.service';

@Module({
  imports: [PrismaModule],
  controllers: [AccountTransactionController],
  providers: [AccountTransactionService, AuthService, MenuService, SubscriptionService, CacheService],
  exports: [AccountTransactionService],
})
export class AccountTransactionModule {}
