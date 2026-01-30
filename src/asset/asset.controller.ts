import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AssetService } from './asset.service';
import { CreateAssetDto, UpdateAssetDto } from './dto/asset.dto';
import { getEffectiveEntityId } from '@/auth/utils/context.util';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@/auth/guards/auth.guard';

@ApiTags('Asset')
@Controller('asset')
@UseGuards(AuthGuard)
@ApiBearerAuth()
@ApiCookieAuth()
export class AssetController {
  constructor(private assetsService: AssetService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new asset' })
  @ApiBody({ type: CreateAssetDto })
  @ApiResponse({ status: 201, description: 'Asset created' })
  async create(@Body() createAsset: CreateAssetDto, @Req() req: Request) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    const userId = req.user?.id as string;
    return this.assetsService.create(createAsset, entityId, userId, req);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a journal entry' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateAssetDto })
  @ApiResponse({ status: 200, description: 'Asset updated' })
  async update(
    @Param('id') id: string,
    @Body() updateAsset: UpdateAssetDto,
    @Req() req: Request,
  ) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.assetsService.update(id, updateAsset, entityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single asset by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Asset found' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }
}
