import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { LogService } from '@/log/log.service';

@Module({
  imports: [PrismaModule],
  providers: [BudgetService, AuthService, LogService],
  controllers: [BudgetController],
})
export class BudgetModule {}
