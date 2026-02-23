import { Module } from '@nestjs/common';
import { JournalService } from './journal.service';
import { JournalPostingService } from './journal-posting.service';
import { JournalController } from './journal.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';

@Module({
  imports: [PrismaModule],
  providers: [JournalService, JournalPostingService, AuthService],
  controllers: [JournalController],
  exports: [JournalPostingService],
})
export class JournalModule {}
