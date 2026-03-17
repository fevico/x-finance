import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { MenuService } from '@/menu/menu.service';
import { CacheService } from '@/cache/cache.service';
import { SubscriptionService } from '@/subscription/subscription.service';

@Module({
  imports: [PrismaModule],
  providers: [ItemsService, AuthService, MenuService, MenuService, SubscriptionService, CacheService],
  controllers: [ItemsController],
})
export class ItemsModule {}
