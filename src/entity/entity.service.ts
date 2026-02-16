import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { GetEntitiesQueryDto } from './dto/get-entities-query.dto';
import { BullmqService } from '@/bullmq/bullmq.service';
import { FileuploadService } from '@/fileupload/fileupload.service';

@Injectable()
export class EntityService {
  constructor(
    private prisma: PrismaService,
    private fileuploadService: FileuploadService,
    private bullmqService: BullmqService,
  ) {}

  // async create(createEntityDto: CreateEntityDto, effectiveGroupId: string) {
  //   return this.prisma.entity.create({
  //     data: { ...createEntityDto, groupId: effectiveGroupId },
  //   });
  // }

  async create(
    createEntityDto: CreateEntityDto,
    effectiveGroupId: string,
    file?: Express.Multer.File,
  ) {
    try {
      let logo: any = undefined;

      // Upload logo to Cloudinary if provided
      if (file) {
        logo = await this.fileuploadService.uploadFile(file, 'groups');
      }

      // Always set logo with publicId and secureUrl, defaulting to empty string if not provided
      const logoData = {
        publicId: logo?.publicId || '',
        secureUrl: logo?.secureUrl || '',
      };

      // console.log(
      //   'Creating entity with data:',
      //   createEntityDto,
      //   'and effectiveGroupId:',
      //   effectiveGroupId,
      // );
      const entity = await this.prisma.entity.create({
        data: {
          ...createEntityDto,
          groupId: effectiveGroupId,
          logo: logoData,
        },
      });

      // Enqueue background job to create entity owner user with entityAdmin role
      await this.bullmqService.addJob('create-entity-user', {
        entityId: entity.id,
        groupId: effectiveGroupId,
        email: createEntityDto.email,
        entityName: createEntityDto.name,
        legalName: createEntityDto.legalName,
      });

      return entity;
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(query: GetEntitiesQueryDto, effectiveGroupId: string) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const search = query.search || '';

    const where: any = { groupId: effectiveGroupId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Avoid starting a DB transaction for simple reads — some serverless DB
    // providers (e.g. Neon) can error when many transactions are started.
    const [data, total] = await Promise.all([
      this.prisma.entity.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.entity.count({ where }),
    ]);

    return {
      entities: data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, effectiveGroupId: string) {
    const entity = await this.prisma.entity.findUnique({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found.`);
    }
    if (entity.groupId !== effectiveGroupId) {
      throw new ForbiddenException(
        'You do not have permission to access this entity.',
      );
    }
    return entity;
  }

  async update(
    id: string,
    updateEntityDto: UpdateEntityDto,
    effectiveGroupId: string,
  ) {
    await this.findOne(id, effectiveGroupId); // Reuse findOne to check for existence and permission
    return this.prisma.entity.update({
      where: { id },
      data: updateEntityDto,
    });
  }

  async remove(id: string, effectiveGroupId: string) {
    await this.findOne(id, effectiveGroupId); // Reuse findOne to check for existence and permission
    return this.prisma.entity.delete({ where: { id } });
  }
}
