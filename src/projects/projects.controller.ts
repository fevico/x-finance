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
import { CreateMilestoneDto, CreateTeamMemberDto, GetEntityMilestonesDto, GetEntityProjectsDto, GetProjectTeamMembersDto, Projects } from './dto/projects.dto';
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
    return this.projectService.createProject(project, entityId);
  }

  @Get()
  async getEntityProjects(
    @Req() req: Request,
    @Query() dto: GetEntityProjectsDto,
  ) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.projectService.getEntityProjects(entityId, dto);
  }

  @Post('milestones')
  async createMilestone(@Body() dto: CreateMilestoneDto, @Req() req: Request) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.projectService.createMilestone(dto, entityId);
  }

  @Get('milestones/entity')
  async getEntityMilestones(
    @Req() req: Request,
    @Query() dto: GetEntityMilestonesDto,
  ) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.projectService.getEntityMilestones(entityId, dto);
  }

  @Post('team-members')
  async createTeamMember(@Body() dto: CreateTeamMemberDto, @Req() req: Request) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.projectService.createTeamMember(dto, entityId);
  }

  @Get('team-members')
  async getProjectTeamMembers(
    @Req() req: Request,
    @Query() dto: GetProjectTeamMembersDto,
  ) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.projectService.getProjectTeamMembers(entityId, dto);
  }
}
