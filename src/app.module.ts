import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { GroupModule } from './group/group.module';
import { EntityModule } from './entity/entity.module';

@Module({
  imports: [PrismaModule, AuthModule, GroupModule, EntityModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
