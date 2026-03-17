import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { FileuploadModule } from '@/fileupload/fileupload.module';
import { CacheService } from '@/cache/cache.service';
import { SubscriptionService } from '@/subscription/subscription.service';
import { MenuService } from '@/menu/menu.service';

@Module({
  imports:[PrismaModule, FileuploadModule],
  providers: [OrganizationService, AuthService, MenuService, SubscriptionService, CacheService],
  controllers: [OrganizationController]
})
export class OrganizationModule {}
