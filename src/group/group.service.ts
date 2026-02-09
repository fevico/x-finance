import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileuploadService } from '@/fileupload/fileupload.service';
import { BullmqService } from '@/bullmq/bullmq.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import * as bcrypt from 'bcrypt';
import { systemRole } from 'prisma/generated/enums';

@Injectable()
export class GroupService {
  constructor(
    private prisma: PrismaService,
    private fileuploadService: FileuploadService,
    private bullmqService: BullmqService,
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
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
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

  findAll() {
    return this.prisma.group.findMany();
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
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  remove(id: string) {
    return this.prisma.group.delete({ where: { id } });
  }
}
