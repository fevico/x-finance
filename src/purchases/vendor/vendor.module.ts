import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthService } from '@/auth/auth.service';

@Module({
  imports:[PrismaModule],
  controllers: [VendorController],
  providers: [VendorService, AuthService]
})
export class VendorModule {}
