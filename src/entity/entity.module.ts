import { Module } from '@nestjs/common';
import { EntityService } from './entity.service';
import { EntityController } from './entity.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { BullmqModule } from '@/bullmq/bullmq.module';
import { FileuploadModule } from '@/fileupload/fileupload.module';
import { CacheService } from '@/cache/cache.service';
import { SubscriptionService } from '@/subscription/subscription.service';
import { MenuService } from '@/menu/menu.service';

@Module({
  imports: [PrismaModule, FileuploadModule, BullmqModule],
  controllers: [EntityController],
  providers: [EntityService, AuthService, MenuService, SubscriptionService, CacheService],
})
export class EntityModule {}
