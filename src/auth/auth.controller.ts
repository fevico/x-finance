import {
  Controller,
  Post,
  Delete,
  Body,
  Res,
  Get,
  UseGuards,
  Req,
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
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { user, tokenPayload } = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );
    // Encrypt minimal payload (userId, groupId, entityId, systemRole) to keep token size small
    const token = await encryptSession(tokenPayload);
    res.setHeader('Set-Cookie', deleteCookie('xf_group'));
    res.setHeader('Set-Cookie', deleteCookie('xf_entity'));
    res.setHeader('Set-Cookie', createCookie('xf', token, 60 * 60 * 24 * 7));
    // Send full user data to client
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
  async startGroup(
    @Body() { groupId, groupName },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const token = await encryptSession({ groupId, groupName }, '7d');
    // res.setHeader(
    //   'Set-Cookie',
    //   createCookie(req, 'xf_group', token, 60 * 60 * 24 * 7),
    // );
    res.setHeader(
      'Set-Cookie',
      createCookie('xf_group', token, 60 * 60 * 24 * 7),
    );
    return res.send({ success: true });
  }

  @Delete('impersonate/group')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(systemRole.superadmin)
  stopGroup(@Req() req: Request, @Res() res: Response) {
    // res.setHeader('Set-Cookie', deleteCookie(req, 'xf_group'));
    res.setHeader('Set-Cookie', deleteCookie('xf_group'));

    return res.send({ success: true });
  }

  @Post('impersonate/entity')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(systemRole.superadmin, systemRole.admin)
  async startEntity(
    @Body() { entityId, entityName },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const token = await encryptSession({ entityId, entityName }, '7d');
    // res.setHeader(
    //   'Set-Cookie',
    //   createCookie(req, 'xf_entity', token, 60 * 60 * 24 * 7),
    // );
    res.setHeader(
      'Set-Cookie',
      createCookie('xf_entity', token, 60 * 60 * 24 * 7),
    );
    return res.send({ success: true });
  }

  @Delete('impersonate/entity')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(systemRole.superadmin, systemRole.admin)
  stopEntity(@Req() req: Request, @Res() res: Response) {
    // res.setHeader('Set-Cookie', deleteCookie(req, 'xf_entity'));
    res.setHeader('Set-Cookie', deleteCookie('xf_entity'));

    return res.send({ success: true });
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User logged out' })
  logout(@Res() res: Response) {
    const domain =
      process.env.NODE_ENV === 'production'
        ? process.env.COOKIE_DOMAIN
        : undefined;

    res.setHeader('Set-Cookie', [
      deleteCookie('xf', domain),
      deleteCookie('xf_group', domain),
      deleteCookie('xf_entity', domain),
    ]);

    return res.send({ success: true });
  }

}
