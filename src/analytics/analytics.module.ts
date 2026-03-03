import { AuthService } from './../auth/auth.service';
import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '@/prisma/prisma.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PrismaService, AuthService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
