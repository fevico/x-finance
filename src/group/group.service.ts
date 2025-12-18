import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileuploadService } from '@/fileupload/fileupload.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupService {
  constructor(
    private prisma: PrismaService,
    private fileuploadService: FileuploadService,
  ) {}

  async create(createGroupDto: CreateGroupDto, file?: Express.Multer.File) {
    try {
      let logo: any = undefined;

      // Upload logo to Cloudinary if provided
      if (file) {
        logo = await this.fileuploadService.uploadFile(file, 'groups');
      }

      return this.prisma.group.create({
        data: {
          ...createGroupDto,
          logo: { publicId: logo.publicId, secureUrl: logo.secureUrl }
        }
      });
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

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
