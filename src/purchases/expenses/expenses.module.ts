import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { FileuploadModule } from '@/fileupload/fileupload.module';

@Module({
  imports: [PrismaModule, FileuploadModule],
  providers: [ExpensesService, AuthService],
  controllers: [ExpensesController],
})
export class ExpensesModule {}
