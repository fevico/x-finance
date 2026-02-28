import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { OpeningBalanceService } from './opening-balance.service';
import { CreateOpeningBalanceDto, UpdateOpeningBalanceDto, GetOpeningBalanceResponseDto } from './dto/opening-balance.dto';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { getEffectiveEntityId } from '@/auth/utils/context.util';

@Controller('accounts/opening-balance')
export class OpeningBalanceController {
  constructor(private readonly openingBalanceService: OpeningBalanceService) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req, @Body() dto: CreateOpeningBalanceDto): Promise<GetOpeningBalanceResponseDto> {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.openingBalanceService.createOpeningBalance(entityId, dto);
  }

  @Get('current')
  @UseGuards(AuthGuard)
  async getByEntity(@Req() req): Promise<GetOpeningBalanceResponseDto | null> {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.openingBalanceService.getOpeningBalanceByEntity(entityId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getOne(@Req() req, @Param('id') id: string): Promise<GetOpeningBalanceResponseDto> {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.openingBalanceService.getOpeningBalance(id, entityId);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Req() req, @Param('id') id: string, @Body() dto: UpdateOpeningBalanceDto): Promise<GetOpeningBalanceResponseDto> {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.openingBalanceService.updateOpeningBalance(id, entityId, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Req() req, @Param('id') id: string): Promise<void> {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.openingBalanceService.deleteOpeningBalance(id, entityId);
  }

  @Post(':id/finalize')
  @UseGuards(AuthGuard)
  async finalize(@Req() req, @Param('id') id: string): Promise<GetOpeningBalanceResponseDto> {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.openingBalanceService.finalizeOpeningBalance(id, entityId);
  }
}
