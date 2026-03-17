import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { MenuService } from '@/menu/menu.service';
import { SubscriptionService } from '@/subscription/subscription.service';
import { CacheService } from '@/cache/cache.service';

@Module({
  imports: [PrismaModule],
  providers: [CustomerService, AuthService, MenuService, MenuService, SubscriptionService, CacheService],
  controllers: [CustomerController],
})
export class CustomerModule {}
