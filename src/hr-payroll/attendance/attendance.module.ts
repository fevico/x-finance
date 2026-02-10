import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { LogService } from '@/log/log.service';

@Module({
  imports: [PrismaModule],
  providers: [AttendanceService, AuthService, LogService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}
