import { Module, forwardRef } from '@nestjs/common';
import { OpeningBalanceService } from './opening-balance.service';
import { OpeningBalanceController } from './opening-balance.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { BullmqModule } from '@/bullmq/bullmq.module';

@Module({
  imports: [PrismaModule, forwardRef(() => BullmqModule)],
  providers: [OpeningBalanceService, AuthService],
  controllers: [OpeningBalanceController],
  exports: [OpeningBalanceService],
})
export class OpeningBalanceModule {}
