import { PrismaService } from '@/prisma/prisma.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateMilestoneDto, CreateTeamMemberDto, GetEntityMilestonesDto, GetEntityProjectsDto, GetProjectTeamMembersDto, Projects } from './dto/projects.dto';
import { generateRandomInvoiceNumber } from '@/auth/utils/helper';
import { ProjectStatus } from 'prisma/generated/enums';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(project: Projects, entityId: string) {
    try {
      const projectnumber = generateRandomInvoiceNumber({ prefix: 'PRO' });
      const data = await this.prisma.project.create({
        data: {
          ...project,
          projectId: projectnumber,
          entityId,
        },
      });
      return data;
    } catch (error) {
        throw new HttpException(`${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async getEntityProjects(
    entityId: string,
    dto: GetEntityProjectsDto,
  ) {
    try {
      const { status, search, page = 1, limit = 10 } = dto;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        entityId,
      };

      // Status filter
      if (status) {
        where.status = status;
      }

      // Search filter (on name, projectId, or description)
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { projectId: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } }, // if you have customer name
        ];
      }

      // Get projects with pagination and relations
      const [projects, total] = await Promise.all([
        this.prisma.project.findMany({
          where,
          include: {
            customer: true,
            entity: true,
          },
          orderBy: {
            createdAt: 'desc', // or startDate, etc.
          },
          skip,
          take: limit,
        }),
        this.prisma.project.count({ where }),
      ]);

      // Calculate statistics
      const stats = await this.calculateProjectStats(entityId, status, search);

      return {
        data: projects,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        stats,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch projects: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createMilestone(dto: CreateMilestoneDto, entityId: string) {
    try {
      return await this.prisma.milestone.create({
        data: {
          ...dto,
          entityId,
        },
      });
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getEntityMilestones(entityId: string, dto: GetEntityMilestonesDto) {
    try {
      const { projectId, status, search, page = 1, limit = 10 } = dto;
      const skip = (page - 1) * limit;

      const where: any = { entityId };

      if (projectId) where.projectId = projectId;
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [milestones, total] = await Promise.all([
        this.prisma.milestone.findMany({
          where,
          include: { project: true },
          orderBy: { dueDate: 'asc' },
          skip,
          take: limit,
        }),
        this.prisma.milestone.count({ where }),
      ]);

      return {
        data: milestones,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch milestones: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createTeamMember(dto: CreateTeamMemberDto, entityId: string) {
    try {
      return await this.prisma.teamMember.create({
        data: {
          ...dto,
          entityId,
        },
      });
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getProjectTeamMembers(entityId: string, dto: GetProjectTeamMembersDto) {
    try {
      const { projectId, page = 1, limit = 10 } = dto;
      const skip = (page - 1) * limit;

      const where = { entityId, projectId };

      const [members, total] = await Promise.all([
        this.prisma.teamMember.findMany({
          where,
          include: { project: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.teamMember.count({ where }),
      ]);

      return {
        data: members,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch team members: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async calculateProjectStats(
    entityId: string,
    status?: ProjectStatus,
    search?: string,
  ) {
    const where: any = { entityId };

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { projectId: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const stats = await this.prisma.project.aggregate({
      where,
      _sum: {
        budgetedRevenue: true,
        budgetedCost: true,
      },
      _count: {
        id: true,
      },
    });

    const totalProjects = stats._count.id;
    const totalRevenue = stats._sum.budgetedRevenue || 0;
    const totalCost = stats._sum.budgetedCost || 0;
    const totalProfit = totalRevenue - totalCost;

    // Active projects (In_Progress or Planning)
    const activeWhere = { ...where, status: { in: ['In_Progress', 'Planning'] } };
    const activeProjects = await this.prisma.project.count({ where: activeWhere });

    // Average profit margin
    let averageProfitMargin = 0;
    if (totalRevenue > 0) {
      averageProfitMargin = Math.round((totalProfit / totalRevenue) * 100);
    }

    return {
      totalProjects,
      totalActive: activeProjects,
      totalBudgetedRevenue: totalRevenue,
      totalBudgetedCost: totalCost,
      totalProfit,
      averageProfitMargin: `${averageProfitMargin}%`,
    };
  }
}
