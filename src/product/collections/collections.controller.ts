import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import {
  CreateCollectionDto,
  CollectionDto,
} from './dto/create-collection.dto';
import { GetCollectionsQueryDto } from './dto/get-collections-query.dto';
import { GetCollectionsResponseDto } from './dto/get-collections-response.dto';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { Req } from '@nestjs/common';
import { Request } from 'express';
import { getEffectiveEntityId } from '@/auth/utils/context.util';

@ApiTags('Collections')
@Controller('collections')
@UseGuards(AuthGuard)
@ApiBearerAuth()
@ApiCookieAuth()
export class CollectionsController {
  constructor(private readonly collectionService: CollectionsService) {}

  @Post('create')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Create a new collection' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Spring Sale' },
        slug: { type: 'string', example: 'spring-sale' },
        description: { type: 'string', example: 'Collection description' },
        visibility: { type: 'boolean', example: false },
        featured: { type: 'boolean', example: false },
        image: { type: 'string', format: 'binary' },
      },
      required: ['name', 'slug', 'description'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Collection created successfully',
    type: CollectionDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request or invalid input' })
  async createCollection(
    @Body() body: CreateCollectionDto,
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');

    return this.collectionService.createCollection(entityId, body, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all collections for entity with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Collections retrieved successfully',
    type: GetCollectionsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getCollections(
    @Query() query: GetCollectionsQueryDto,
    @Req() req: Request,
  ): Promise<GetCollectionsResponseDto> {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');

    return this.collectionService.getCollections(entityId, query);
  }
}
