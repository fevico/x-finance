import { Module } from '@nestjs/common';
import { OpeningBalanceService } from './opening-balance.service';
import { OpeningBalanceController } from './opening-balance.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';

@Module({
  imports: [PrismaModule],
  providers: [OpeningBalanceService, AuthService],
  controllers: [OpeningBalanceController],
})
export class OpeningBalanceModule {}
