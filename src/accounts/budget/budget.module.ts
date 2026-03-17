import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { CacheService } from '@/cache/cache.service';
import { SubscriptionService } from '@/subscription/subscription.service';
import { MenuService } from '@/menu/menu.service';

@Module({
  imports: [PrismaModule],
  providers: [BudgetService, AuthService, MenuService, SubscriptionService, CacheService],
  controllers: [BudgetController],
})
export class BudgetModule {}
