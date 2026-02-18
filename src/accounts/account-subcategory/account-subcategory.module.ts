import { Module } from '@nestjs/common';
import { AccountSubCategoryService } from './account-subcategory.service';
import { AccountSubCategoryController } from './account-subcategory.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';

@Module({
  imports: [PrismaModule],
  controllers: [AccountSubCategoryController],
  providers: [AccountSubCategoryService, AuthService],
  exports: [AccountSubCategoryService],
})
export class AccountSubCategoryModule {}
