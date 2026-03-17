import { Module } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { FileuploadModule } from '@/fileupload/fileupload.module';
import { CacheService } from '@/cache/cache.service';
import { SubscriptionService } from '@/subscription/subscription.service';
import { MenuService } from '@/menu/menu.service';

@Module({
  imports: [PrismaModule, FileuploadModule],
  providers: [CollectionsService, AuthService, MenuService, SubscriptionService, CacheService],
  controllers: [CollectionsController],
})
export class CollectionsModule {}
