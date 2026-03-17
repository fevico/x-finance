import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { AuthService } from '@/auth/auth.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { CacheService } from '@/cache/cache.service';
import { SubscriptionService } from '@/subscription/subscription.service';
import { MenuService } from '@/menu/menu.service';

@Module({
  imports: [PrismaModule],
  providers: [AccountService, AuthService, MenuService, MenuService, SubscriptionService, CacheService],
  controllers: [AccountController],
  exports: [AccountService],
})
export class AccountModule {}
