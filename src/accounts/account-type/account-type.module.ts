import { Module } from '@nestjs/common';
import { AccountTypeService } from './account-type.service';
import { AccountTypeController } from './account-type.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';

@Module({
  imports: [PrismaModule],
  controllers: [AccountTypeController],
  providers: [AccountTypeService, AuthService],
  exports: [AccountTypeService],
})
export class AccountTypeModule {}
