import { PrismaService } from '@/prisma/prisma.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAssetDto, UpdateAssetDto } from './dto/asset.dto';
import { LogService } from '@/log/log.service';

@Injectable()
export class AssetService {
  constructor(
    private prisma: PrismaService,
    private auditService: LogService,
  ) {}

  async create(
    createAsset: CreateAssetDto,
    entityId: string,
    userId: string,
    req: any,
  ) {
    try {
      const entity = await this.prisma.entity.findUnique({
        where: { id: entityId },
      });
      if (!entity) throw new UnauthorizedException('Access denied!');
      const assest = await this.prisma.asset.create({
        data: { ...createAsset, entityId },
      });
      await this.auditService.logAsync({
        userId,
        action: 'ASSET CREATED',
        req,
      });

      return assest;
    } catch (error) {
      throw new HttpException(
        `${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(entityId: string) {
    try {
      const result = await this.prisma.$transaction([
        this.prisma.asset.count({ where: { entityId } }),
        this.prisma.asset.count({ where: { entityId, status: 'in_use' } }),
        this.prisma.asset.count({ where: { entityId, status: 'in_storage' } }),
        this.prisma.asset.aggregate({
          where: { entityId, trackDepreciation: true },
          _sum: { currentValue: true },
        }),
        this.prisma.asset.findMany({
          where: { entityId },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const [total, inUse, inStorage, depreciableAgg, assets] = result;

      return {
        success: true,
        data: {
          summary: {
            total,
            inUse,
            inStorage,
            depreciableValue: depreciableAgg._sum.currentValue ?? 0,
          },
          assets,
        },
      };
    } catch (error) {
      console.error('Asset overview failed:', error);
      throw new HttpException(
        `${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateAsset: UpdateAssetDto, entityId: string) {}

  async findOne(id: string) {}
}
