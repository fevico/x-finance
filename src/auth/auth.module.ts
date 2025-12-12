import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthGuard } from './guards/auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [PrismaModule],
  providers: [AuthService, AuthGuard, RolesGuard, PermissionsGuard],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
