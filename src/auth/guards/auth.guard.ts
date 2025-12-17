import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { decryptSession } from '../utils/crypto.util';
import { deleteCookie } from '../utils/cookie.util';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    // const main session (xf)
    const mainToken: string | undefined = req.cookies?.['xf'] as
      | string
      | undefined;
    if (!mainToken) {
      throw new UnauthorizedException();
    }

    const mainPayload = await decryptSession(mainToken);
    if (!mainPayload) {
      res.setHeader('Set-Cookie', deleteCookie(req, 'xf'));
      throw new UnauthorizedException();
    }

    req.user = mainPayload as Request['user'];

    // Group impersonation
    const groupToken: string | undefined = req.cookies?.['xf_group'] as
      | string
      | undefined;
    if (groupToken) {
      const groupPayload = await decryptSession(groupToken);
      if (groupPayload) {
        req.groupImpersonation = {
          groupId: groupPayload.groupId as string,
          groupName: groupPayload.groupName as string,
        };
      } else {
        res.setHeader('Set-Cookie', deleteCookie(req, 'xf_group'));
      }
    }

    // Entity impersonation
    const entityToken: string | undefined = req.cookies?.['xf_entity'] as
      | string
      | undefined;
    if (entityToken) {
      const entityPayload = await decryptSession(entityToken);
      if (entityPayload) {
        req.entityImpersonation = {
          entityId: entityPayload.entityId as string,
          entityName: entityPayload.entityName as string,
        };
      } else {
        res.setHeader('Set-Cookie', deleteCookie(req, 'xf_entity'));
      }
    }

    return true;
  }
}
