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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Successful login' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({ type: LoginDto })
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
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user' })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  me(@User() user) {
    return user;
  }

  @Post('impersonate/group')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(systemRole.superadmin)
  @ApiOperation({ summary: 'Start impersonating a group' })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  async startGroup(@Body() { groupId, groupName }, @Res() res: Response) {
    const token = await encryptSession({ groupId, groupName }, '30m');
    res.setHeader('Set-Cookie', createCookie('xf_group', token, 60 * 30));
    return res.send({ success: true });
  }

  @Delete('impersonate/group')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(systemRole.superadmin)
  @ApiOperation({ summary: 'Stop impersonating a group' })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  stopGroup(@Res() res: Response) {
    res.setHeader('Set-Cookie', deleteCookie('xf_group'));
    return res.send({ success: true });
  }

  @Post('impersonate/entity')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(systemRole.superadmin, systemRole.admin)
  @ApiOperation({ summary: 'Start impersonating an entity' })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  async startEntity(@Body() { entityId, entityName }, @Res() res: Response) {
    const token = await encryptSession({ entityId, entityName }, '30m');
    res.setHeader('Set-Cookie', createCookie('xf_entity', token, 60 * 30));
    return res.send({ success: true });
  }

  @Delete('impersonate/entity')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(systemRole.superadmin, systemRole.admin)
  @ApiOperation({ summary: 'Stop impersonating an entity' })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  stopEntity(@Res() res: Response) {
    res.setHeader('Set-Cookie', deleteCookie('xf_entity'));
    return res.send({ success: true });
  }
}
