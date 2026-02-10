import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LogService {
  constructor(private prisma: PrismaService) {}
  async log({
    userId,
    action,
    req, // pass Express Request object
  }: {
    userId: string;
    action: string;
    req: any; // Request from express (or Fastify if you use it)
  }) {
    // ────────────────────────────────────────────────
    // Extract real client IP (handles proxies/load balancers)
    // Priority: x-forwarded-for → real-ip → socket remote → fallback
    // ────────────────────────────────────────────────
    let ipAddress: string | null = null;

    const xff = req.headers['x-forwarded-for'];
    if (xff) {
      // Most common: first non-internal IP in chain
      const ips = Array.isArray(xff) ? xff[0] : xff;
      ipAddress = ips.split(',')[0].trim() || null;
    }

    if (!ipAddress) {
      ipAddress =
        req.headers['x-real-ip'] ||
        req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        null;
    }

    // Clean up localhost / IPv6 loopback
    if (ipAddress === '::1' || ipAddress === '127.0.0.1') {
      ipAddress = 'localhost';
    }

    const device = (req.headers['user-agent'] as string) || null;

    // Optional: you could add geo lookup here later (ipapi.co, MaxMind, ...)
    // const location = await this.geoService.getLocationFromIp(ipAddress);

    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        ipAddress: ipAddress || 'unknown',
        device: device || 'unknown',
        // location: location || null,     // if you add geo later
      },
    });
  }

  // Fire-and-forget version (non-blocking)
  async logAsync(params: Parameters<LogService['log']>[0]) {
    this.log(params).catch((err) => {
      console.error('Audit log failed:', err);
      // you could send to Sentry / your error service here
    });
  }
}
