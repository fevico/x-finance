import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { getEffectiveEntityId } from '@/auth/utils/context.util';
import { CreateReceiptDto } from './dto/receipt.dto';
import { GetReceiptsQueryDto } from './dto/get-receipts-query.dto';
import { GetReceiptsResponseDto } from './dto/get-receipts-response.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Receipts')
@Controller('sales/receipts')
export class ReceiptController {
  constructor(private receiptService: ReceiptService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a receipt for the current entity' })
  @ApiBody({ type: CreateReceiptDto })
  @ApiUnauthorizedResponse({ description: 'Access denied' })
  async create(@Body() body: CreateReceiptDto, @Req() req) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.receiptService.createReceipt(body, entityId);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get receipts for an entity (pagination, filters, search)',
  })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  @ApiOkResponse({ type: GetReceiptsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Access denied' })
  async getReceipts(@Req() req, @Query() query: GetReceiptsQueryDto) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.receiptService.getEntityReceipts(entityId, query);
  }
}
