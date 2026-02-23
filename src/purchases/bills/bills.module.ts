import { Module } from '@nestjs/common';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { FileuploadModule } from '@/fileupload/fileupload.module';
import { JournalModule } from '@/accounts/journal/journal.module';
import { AuthService } from '@/auth/auth.service';

@Module({
  imports: [PrismaModule, FileuploadModule, JournalModule],
  controllers: [BillsController],
  providers: [BillsService, AuthService],
})
export class BillsModule {}
