import { Module } from '@nestjs/common';
import { AccountCategoryService } from './account-category.service';
import { AccountCategoryController } from './account-category.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { CacheService } from '@/cache/cache.service';
import { SubscriptionService } from '@/subscription/subscription.service';
import { MenuService } from '@/menu/menu.service';

@Module({
  imports: [PrismaModule],
  controllers: [AccountCategoryController],
  providers: [AccountCategoryService, AuthService, MenuService, MenuService, SubscriptionService, CacheService],
  exports: [AccountCategoryService],
})
export class AccountCategoryModule {}
