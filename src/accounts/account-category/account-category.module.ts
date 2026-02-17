import { Module } from '@nestjs/common';
import { AccountCategoryService } from './account-category.service';
import { AccountCategoryController } from './account-category.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';

@Module({
  imports: [PrismaModule],
  controllers: [AccountCategoryController],
  providers: [AccountCategoryService, AuthService],
  exports: [AccountCategoryService],
})
export class AccountCategoryModule {}
