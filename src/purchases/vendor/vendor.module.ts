import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { CacheService } from '@/cache/cache.service';
import { MenuService } from '@/menu/menu.service';
import { SubscriptionService } from '@/subscription/subscription.service';

@Module({
  imports: [PrismaModule],
  controllers: [VendorController],
  providers: [VendorService, AuthService, MenuService, MenuService, SubscriptionService, CacheService],
})
export class VendorModule {}
