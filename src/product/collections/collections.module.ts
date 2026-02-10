import { Module } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { FileuploadModule } from '@/fileupload/fileupload.module';

@Module({
  imports: [PrismaModule, FileuploadModule],
  providers: [CollectionsService, AuthService],
  controllers: [CollectionsController],
})
export class CollectionsModule {}
