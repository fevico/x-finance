import { Module } from '@nestjs/common';
import { AccountSubCategoryService } from './account-subcategory.service';
import { AccountSubCategoryController } from './account-subcategory.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { CacheService } from '@/cache/cache.service';
import { SubscriptionService } from '@/subscription/subscription.service';
import { MenuService } from '@/menu/menu.service';

@Module({
  imports: [PrismaModule],
  controllers: [AccountSubCategoryController],
  providers: [AccountSubCategoryService, AuthService, MenuService, SubscriptionService, CacheService],
  exports: [AccountSubCategoryService],
})
export class AccountSubCategoryModule {}
