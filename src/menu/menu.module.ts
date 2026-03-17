import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
