import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createNamespace } from 'cls-hooked';

const TENANT_NAMESPACE = 'tenant-namespace';
const ns = createNamespace(TENANT_NAMESPACE);

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Prefer subdomain from host, fallback to x-tenant header
    const host = req.headers.host || '';
    let subdomain = '';
    const parts = host.split('.');
    if (host.endsWith('.local')) {
      // local: tenant1.local
      subdomain = parts[0];
    } else {
      // prod: tenant1.x-finance.com
      if (parts.length > 2) subdomain = parts[0];
    }
    if (!subdomain) {
      subdomain = req.headers['x-tenant'] as string || '';
    }
    console.log('[TenantMiddleware] host:', host, 'subdomain:', subdomain, 'x-tenant:', req.headers['x-tenant']);
    ns.run(() => {
      ns.set('tenant', subdomain);
      console.log('[TenantMiddleware] set CLS tenant:', ns.get('tenant'));
      next();
    });
  }
}

export function getTenantSlug(): string {
  return ns.get('tenant');
}
