import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { LogService } from '@/log/log.service';
import { AuthService } from '@/auth/auth.service';
import { FileuploadModule } from '@/fileupload/fileupload.module';

@Module({
  imports: [PrismaModule, FileuploadModule],
  providers: [EmployeeService, AuthService, LogService],
  controllers: [EmployeeController],
})
export class EmployeeModule {}
