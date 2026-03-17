import { AuthService } from './../auth/auth.service';
import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '@/prisma/prisma.service';
import { MenuService } from '@/menu/menu.service';
import { SubscriptionService } from '@/subscription/subscription.service';
import { CacheService } from '@/cache/cache.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PrismaService, AuthService, MenuService, SubscriptionService, CacheService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
