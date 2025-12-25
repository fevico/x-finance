import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { GetCollectionsQueryDto } from './dto/get-collections-query.dto';
import { GetCollectionsResponseDto } from './dto/get-collections-response.dto';
import { FileuploadService } from '@/fileupload/fileupload.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileuploadService: FileuploadService,
  ) {}

  async createCollection(
    entityId: string,
    body: CreateCollectionDto,
    file?: Express.Multer.File,
  ) {
    let image: { publicId: any; secureUrl: any } | undefined = undefined;

    if (file) {
      try {
        const uploadResult = await this.fileuploadService.uploadFile(
          file,
          `collections/${entityId}`,
        );
        image = {
          publicId: uploadResult.publicId,
          secureUrl: uploadResult.secureUrl,
        };
      } catch (error) {
        throw new BadRequestException(`Image upload failed: ${error.message}`);
      }
    }

    const collection = await this.prisma.collection.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        visibility: body.visibility ?? false,
        featured: body.featured ?? false,
        entityId,
        image: image  
          ? { publicId: image.publicId, secureUrl: image.secureUrl }
          : undefined,
      },
    });

    return {
      ...collection,
      image:
        collection.image === null
          ? undefined
          : (collection.image as Record<string, any>),
      createdAt:
        collection.createdAt instanceof Date
          ? collection.createdAt.toISOString()
          : collection.createdAt,
    };
  }

  async getCollections(
    entityId: string,
    query: GetCollectionsQueryDto,
  ): Promise<GetCollectionsResponseDto> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { entityId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [collections, total] = await Promise.all([
      this.prisma.collection.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.collection.count({ where }),
    ]);

    const transformed = collections.map((c) => ({
      ...c,
      image: c.image === null ? undefined : (c.image as Record<string, any>),
      createdAt:
        c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      collections: transformed,
      total,
      currentPage: page,
      pageSize: limit,
      totalPages,
    };
  }
}
