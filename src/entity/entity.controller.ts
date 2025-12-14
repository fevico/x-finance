import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { EntityService } from './entity.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { systemRole } from 'prisma/generated/enums';
import { Request } from 'express';
import { getEffectiveGroupId } from '../auth/utils/context.util';

@UseGuards(AuthGuard)
@Controller('entities')
export class EntityController {
  constructor(private readonly entityService: EntityService) {}

  @Post()
  create(@Body() createEntityDto: CreateEntityDto, @Req() req: Request) {
    const effectiveGroupId = getEffectiveGroupId(req);
    if (!effectiveGroupId) {
      throw new ForbiddenException('No effective group ID found.');
    }
    return this.entityService.create(createEntityDto, effectiveGroupId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(systemRole.admin, systemRole.superadmin)
  findAll(@Req() req: Request) {
    const effectiveGroupId = getEffectiveGroupId(req);
    if (!effectiveGroupId) {
      throw new ForbiddenException('No effective group ID found.');
    }
    return this.entityService.findAll(effectiveGroupId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const effectiveGroupId = getEffectiveGroupId(req);
    if (!effectiveGroupId) {
      throw new ForbiddenException('No effective group ID found.');
    }
    return this.entityService.findOne(id, effectiveGroupId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(systemRole.admin, systemRole.superadmin)
  update(
    @Param('id') id: string,
    @Body() updateEntityDto: UpdateEntityDto,
    @Req() req: Request,
  ) {
    const effectiveGroupId = getEffectiveGroupId(req);
    if (!effectiveGroupId) {
      throw new ForbiddenException('No effective group ID found.');
    }
    return this.entityService.update(id, updateEntityDto, effectiveGroupId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(systemRole.admin, systemRole.superadmin)
  remove(@Param('id') id: string, @Req() req: Request) {
    const effectiveGroupId = getEffectiveGroupId(req);
    if (!effectiveGroupId) {
      throw new ForbiddenException('No effective group ID found.');
    }
    return this.entityService.remove(id, effectiveGroupId);
  }
}
