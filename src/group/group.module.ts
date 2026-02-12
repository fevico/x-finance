import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BullmqModule } from '@/bullmq/bullmq.module';
import { AuthService } from '@/auth/auth.service';
import { FileuploadModule } from '@/fileupload/fileupload.module';
import { TenantService } from '@/tenant/tenant.service';
import { RedisService } from '@/redis/redis.service';

@Module({
  imports: [PrismaModule, FileuploadModule, BullmqModule],
  controllers: [GroupController],
  providers: [GroupService, AuthService, TenantService, RedisService,],
})
export class GroupModule {}
