import { Module } from '@nestjs/common';
import { EntityService } from './entity.service';
import { EntityController } from './entity.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { BullmqModule } from '@/bullmq/bullmq.module';
import { FileuploadModule } from '@/fileupload/fileupload.module';

@Module({
  imports: [PrismaModule, FileuploadModule, BullmqModule],
  controllers: [EntityController],
  providers: [EntityService, AuthService],
})
export class EntityModule {}
