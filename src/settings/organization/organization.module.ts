import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { FileuploadModule } from '@/fileupload/fileupload.module';

@Module({
  imports:[PrismaModule, FileuploadModule],
  providers: [OrganizationService, AuthService],
  controllers: [OrganizationController]
})
export class OrganizationModule {}
