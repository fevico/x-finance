import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  Get,
  Query,
  Param,
  Patch,
} from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { getEffectiveEntityId } from '@/auth/utils/context.util';
import { CreateReceiptDto, UpdateReceiptDto } from './dto/receipt.dto';
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
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiParam,
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

  @Get(':receiptId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get a single receipt by ID' })
  @ApiParam({ name: 'receiptId', description: 'Receipt ID', type: 'string' })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  @ApiOkResponse({ description: 'Receipt details' })
  @ApiUnauthorizedResponse({ description: 'Access denied' })
  @ApiNotFoundResponse({ description: 'Receipt not found' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to access this receipt',
  })
  async getReceipt(@Req() req, @Param('receiptId') receiptId: string) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.receiptService.getReceiptById(receiptId, entityId);
  }

  @Patch(':receiptId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update a receipt by ID' })
  @ApiParam({ name: 'receiptId', description: 'Receipt ID', type: 'string' })
  @ApiBody({ type: UpdateReceiptDto })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  @ApiOkResponse({ description: 'Receipt updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Access denied' })
  @ApiNotFoundResponse({ description: 'Receipt not found' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to update this receipt',
  })
  async updateReceipt(
    @Req() req,
    @Param('receiptId') receiptId: string,
    @Body() body: UpdateReceiptDto,
  ) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.receiptService.updateReceipt(receiptId, entityId, body);
  }
}
