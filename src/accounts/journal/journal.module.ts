import { Module, forwardRef } from '@nestjs/common';
import { JournalService } from './journal.service';
import { JournalPostingService } from './journal-posting.service';
import { JournalController } from './journal.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { BullmqModule } from '@/bullmq/bullmq.module';
import { AuthService } from '@/auth/auth.service';

@Module({
  imports: [PrismaModule, forwardRef(() => BullmqModule)],
  providers: [JournalService, JournalPostingService, AuthService],
  controllers: [JournalController],
  exports: [JournalPostingService, JournalService],
})
export class JournalModule {}
