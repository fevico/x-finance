import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class BullmqService {
  constructor(@InjectQueue('default') private readonly queue: Queue) {}
  async addJob(name: string, data: any, options?: any): Promise<void> {
    await this.queue.add(name, data, options);
  }
}
