import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { GetEntityProjectsDto, Projects } from './dto/projects.dto';
import { getEffectiveEntityId } from '@/auth/utils/context.util';
import { Request } from 'express';
import { AuthGuard } from '@/auth/guards/auth.guard';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(private projectService: ProjectsService) {}

  @Post()
  async create(@Body() project: Projects, @Req() req: Request) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.projectService.createProject(project, entityId)
  }

  @Get('entity')
  async getEntityProjects(
    @Req() req: Request,
    @Query() dto: GetEntityProjectsDto,
  ) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.projectService.getEntityProjects(entityId, dto);
  }
}
