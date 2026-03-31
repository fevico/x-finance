import { Controller, Post, Get, Patch, Delete, Param, Body, Req, BadRequestException, UseGuards } from '@nestjs/common';
import { RestockHistoryService } from './restock-history.service';
import { CreateRestockHistoryDto, UpdateRestockHistoryDto } from './restock-history.dto';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { getEffectiveEntityId } from '@/auth/utils/context.util';


@UseGuards(AuthGuard)
@Controller('store-supply/restock-history')
export class RestockHistoryController {
  constructor(private readonly service: RestockHistoryService) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateRestockHistoryDto) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.service.create(dto, entityId);
  }

  @Get()
  async findAll(@Req() req) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.service.findAll(entityId);
  }

  @Get(':id')
  async findOne(@Req() req, @Param('id') id: string) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.service.findOne(id, entityId);
  }

  @Patch(':id')
  async update(@Req() req, @Param('id') id: string, @Body() dto: UpdateRestockHistoryDto) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.service.update(id, dto, entityId);
  }

  @Delete(':id')
  async remove(@Req() req, @Param('id') id: string) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.service.remove(id, entityId);
  }
}
