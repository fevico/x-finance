import { Module } from '@nestjs/common';
import { EntityService } from './entity.service';
import { EntityController } from './entity.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';

@Module({
  imports: [PrismaModule],
  controllers: [EntityController],
  providers: [EntityService, AuthService],
})
export class EntityModule {}
