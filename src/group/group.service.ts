import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileuploadService } from '@/fileupload/fileupload.service';
import { BullmqService } from '@/bullmq/bullmq.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GetGroupsQueryDto } from './dto/get-groups-query.dto';
import 'multer';
import { Prisma } from 'prisma/generated/client';
import { TenantService } from '@/tenant/tenant.service';

@Injectable()
export class GroupService {
  constructor(
    private prisma: PrismaService,
    private fileuploadService: FileuploadService,
    private bullmqService: BullmqService,
    private tenantService: TenantService,
  ) {}

  async create(createGroupDto: CreateGroupDto, file?: Express.Multer.File) {
    try {
      let logo: any = undefined;

      // Upload logo to Cloudinary if provided
      if (file) {
        logo = await this.fileuploadService.uploadFile(file, 'groups');
      }

      console.log('logo data', logo);
      // Always set logo with publicId and secureUrl, defaulting to empty string if not provided
      const logoData = {
        publicId: logo?.publicId || '',
        secureUrl: logo?.secureUrl || '',
      };

      const group = await this.prisma.group.create({
        data: {
          ...createGroupDto,
          logo: logoData,
        },
      });

      // enqueue background job to create default role and owner user
      await this.bullmqService.addJob('create-group-user', {
        groupId: group.id,
        email: createGroupDto.email,
        groupName: createGroupDto.name,
      });

      return group;
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // async create(createGroupDto: CreateGroupDto, file?: Express.Multer.File) {
  //   try {
  //     let logo: any = undefined;

  //     // Upload logo if provided
  //     if (file) {
  //       logo = await this.fileuploadService.uploadFile(file, 'groups');
  //     }

  //     const logoData = {
  //       publicId: logo?.publicId || '',
  //       secureUrl: logo?.secureUrl || '',
  //     };

  //     // ────────────────────────────────────────────────
  //     //           The important part starts here
  //     // ────────────────────────────────────────────────

  //     return await this.prisma.$transaction(async (tx) => {
  //       // 1. Create the group
  //       const group = await tx.group.create({
  //         data: {
  //           ...createGroupDto,
  //           logo: logoData,
  //         },
  //       });

  //       // 2. Create the owner/admin user (assuming createGroupDto has these fields)
  //       //    Adjust field names if they are different in your DTO
  //       const password = 'Password123';
  //       const hashPassword = await bcrypt.hash(password, 10);
  //       const owner = await tx.user.create({
  //         data: {
  //           email: createGroupDto.email,
  //           firstName: createGroupDto.name,
  //           lastName: 'Admin',
  //           groupId: group.id,
  //           password: hashPassword,
  //         },
  //       });

  //       // Optional: return both for the controller
  //       return {
  //         group,
  //         owner: {
  //           id: owner.id,
  //           email: owner.email,
  //           firstName: owner.firstName,
  //           lastName: owner.lastName,
  //         },
  //       };
  //     });
  //   } catch (error) {
  //     // Improve error message — especially useful in development
  //     const message = error instanceof Error ? error.message : 'Unknown error';

  //     if (error.code === 'P2002') {
  //       throw new HttpException(
  //         'Email or group name already exists',
  //         HttpStatus.CONFLICT,
  //       );
  //     }

  //     throw new HttpException(
  //       `Failed to create group: ${message}`,
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }
  // }

  async findAll(query: GetGroupsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const search = query.search || '';

    // Build where clause for search
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Avoid starting a DB transaction for simple reads — some serverless DB
    // providers (e.g. Neon) can error when many transactions are started.
    const [data, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.group.count({ where }),
    ]);

    return {
      groups: data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  findOne(id: string) {
    return this.prisma.group.findUnique({ where: { id } });
  }

  async update(
    id: string,
    updateGroupDto: UpdateGroupDto,
    file?: Express.Multer.File,
  ) {
    try {
      let logo: any = undefined;

      // Upload new logo to Cloudinary if provided
      if (file) {
        logo = await this.fileuploadService.uploadFile(file, 'groups');
      }

      return this.prisma.group.update({
        where: { id },
        data: {
          ...updateGroupDto,
          ...(logo && {
            logo: { publicId: logo.publicId, secureUrl: logo.secureUrl },
          }),
        },
      });
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async remove(id: string) {
    try {
      const [rolesCount, usersCount, entitiesCount] = await Promise.all([
        this.prisma.groupRole.count({ where: { groupId: id } }),
        this.prisma.user.count({ where: { groupId: id } }),
        this.prisma.entity.count({ where: { groupId: id } }),
      ]);

      const blockers: string[] = [];
      if (rolesCount > 0) blockers.push(`group roles (${rolesCount})`);
      if (usersCount > 0) blockers.push(`users (${usersCount})`);
      if (entitiesCount > 0) blockers.push(`entities (${entitiesCount})`);

      if (blockers.length > 0) {
        throw new HttpException(
          `Cannot delete group because related records exist: ${blockers.join(', ')}`,
          HttpStatus.CONFLICT,
        );
      }

      try {
        return await this.prisma.group.delete({ where: { id } });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2003'
        ) {
          throw new HttpException(
            'Cannot delete group because related records exist',
            HttpStatus.CONFLICT,
          );
        }
        throw err;
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new HttpException(
          'Cannot delete group because related records exist',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getTenantConfig() {
    return this.tenantService.getTenantConfig();
  }
}
