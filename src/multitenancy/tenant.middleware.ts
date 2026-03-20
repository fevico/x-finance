import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract subdomain from host
      // Format: [subdomain].api.example.com or just api.example.com
      const host = req.get('host') || '';
      const hostParts = host.split('.');

      let subdomain: string | null = null;
      if (hostParts.length > 2) {
        subdomain = hostParts[0]; // e.g., 'acme' from 'acme.api.example.com'
      }

      if (subdomain && subdomain !== 'api' && subdomain !== 'localhost') {
        // Resolve subdomain to group
        const group = await this.prisma.group.findUnique({
          where: { subdomain },
        });

        if (!group) {
          throw new UnauthorizedException(`Invalid tenant: ${subdomain}`);
        }

        // Inject into request for use across services
        (req as any).tenantId = group.id;
      }

      // If no subdomain, tenant context will be derived from cookie/JWT
      next();
    } catch (error) {
      // Let other middleware handle the error
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      next();
    }
  }
}
