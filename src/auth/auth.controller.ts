import {
  Controller,
  Post,
  Delete,
  Body,
  Res,
  Get,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { User } from 'src/lib/req-user';
import { AuthService } from './auth.service';
import { encryptSession } from './utils/crypto.util';
import { createCookie, deleteCookie } from './utils/cookie.util';
import { AuthGuard } from './guards/auth.guard';
import { Permissions } from './decorators/permissions.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { systemRole } from 'prisma/generated/enums';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const user = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );
    const token = await encryptSession(user);
    res.setHeader('Set-Cookie', createCookie('xf', token, 60 * 60 * 24 * 7));
    return res.send(user);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@User() user) {
    return user;
  }

  @Post('impersonate/group')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(systemRole.superadmin)
  async startGroup(@Body() { groupId, groupName }, @Res() res: Response) {
    const token = await encryptSession({ groupId, groupName }, '7d');
    res.setHeader(
      'Set-Cookie',
      createCookie('xf_group', token, 60 * 60 * 24 * 7),
    );
    return res.send({ success: true });
  }

  @Delete('impersonate/group')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(systemRole.superadmin)
  stopGroup(@Res() res: Response) {
    res.setHeader('Set-Cookie', deleteCookie('xf_group'));
    return res.send({ success: true });
  }

  @Post('impersonate/entity')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(systemRole.superadmin, systemRole.admin)
  async startEntity(@Body() { entityId, entityName }, @Res() res: Response) {
    const token = await encryptSession({ entityId, entityName }, '7d');
    res.setHeader(
      'Set-Cookie',
      createCookie('xf_entity', token, 60 * 60 * 24 * 7),
    );
    return res.send({ success: true });
  }

  @Delete('impersonate/entity')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(systemRole.superadmin, systemRole.admin)
  stopEntity(@Res() res: Response) {
    res.setHeader('Set-Cookie', deleteCookie('xf_entity'));
    return res.send({ success: true });
  }
}
