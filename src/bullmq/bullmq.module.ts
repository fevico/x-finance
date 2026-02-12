import { Module } from '@nestjs/common';
import { BullmqService } from './bullmq.service';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@/prisma/prisma.module';
import { BullmqProcessor } from './bullmq.processor';
import { EmailService } from '@/email/email.service';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue({ name: 'default' }),
    PrismaModule,
  ],
  providers: [BullmqService, BullmqProcessor, EmailService],
  exports: [BullmqService],
})
export class BullmqModule {}
