import { Module } from '@nestjs/common';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';
import { LogService } from '@/log/log.service';

@Module({
  imports: [PrismaModule],
  providers: [AssetService, AuthService, LogService],
  controllers: [AssetController],
})
export class AssetModule {}
