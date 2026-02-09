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
import { BullmqService } from '@/bullmq/bullmq.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EntityService {
  constructor(
    private prisma: PrismaService,
    private bullmqService: BullmqService,
  ) {}

  // async create(createEntityDto: CreateEntityDto, effectiveGroupId: string) {
  //   return this.prisma.entity.create({
  //     data: { ...createEntityDto, groupId: effectiveGroupId },
  //   });
  // }

  async create(createEntityDto: CreateEntityDto, effectiveGroupId: string) {
    try {
      const entity = await this.prisma.entity.create({
        data: {
          ...createEntityDto,
          groupId: effectiveGroupId,
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
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }


  findAll(effectiveGroupId: string) {
    return this.prisma.entity.findMany({
      where: { groupId: effectiveGroupId },
    });
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
