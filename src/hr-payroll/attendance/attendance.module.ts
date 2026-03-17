import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { CacheService } from '@/cache/cache.service';
import { SubscriptionService } from '@/subscription/subscription.service';
import { MenuService } from '@/menu/menu.service';

@Module({
  imports: [PrismaModule],
  providers: [AttendanceService, AuthService, MenuService, SubscriptionService, CacheService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}
