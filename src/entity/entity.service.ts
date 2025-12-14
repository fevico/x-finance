import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';

@Injectable()
export class EntityService {
  constructor(private prisma: PrismaService) {}

  async create(createEntityDto: CreateEntityDto, effectiveGroupId: string) {
    if (createEntityDto.groupId !== effectiveGroupId) {
      throw new ForbiddenException(
        'You can only create entities within your effective group.',
      );
    }
    return this.prisma.entity.create({
      data: createEntityDto,
    });
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
