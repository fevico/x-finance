import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import Redis from 'ioredis';
import { getTenantSlug } from '@/middleware/tenant.middleware';

export type TenantConfig = {
  id?: string;
  name?: string;
  logo?: string;
  favicon?: string;
  colors?: {
    primary?: string;
    bg?: string;
    text?: string;
  };
};

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getTenantConfig(): Promise<TenantConfig | null> {
    const slug = getTenantSlug();
    if (!slug) return null;
    const cacheKey = `tenant:config:${slug}`;
    // Try cache first
    const redis = this.redisService.getClient();
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    // Miss → DB
    const group = await this.prisma.group.findUnique({ where: { slug } });
    if (!group) return null;
    // Random color generator
    function randomColor() {
      return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    }
    const logoObj = typeof group.logo === 'object' && group.logo !== null ? group.logo as any : {};
    const config: TenantConfig = {
      id: group.id,
      name: group.name,
      logo: logoObj.secureUrl || '',
      favicon: logoObj.secureUrl || '',
      colors: {
        primary: randomColor(),
        bg: randomColor(),
        text: randomColor(),
      },
    };
    await redis.set(cacheKey, JSON.stringify(config), 'EX', 3600);
    return config;
  }

  async invalidateTenantCache(slug: string) {
    const redis = this.redisService.getClient();
    await redis.del(`tenant:config:${slug}`);
  }
}
