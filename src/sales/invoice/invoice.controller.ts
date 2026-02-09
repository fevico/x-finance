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
import { InvoiceService } from './invoice.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { getEffectiveEntityId } from '@/auth/utils/context.util';
import { CreateInvoiceDto } from './dto/invoice.dto';
import { GetInvoicesQueryDto } from './dto/get-invoices-query.dto';
import { GetPaidInvoicesQueryDto } from './dto/get-paid-invoices-query.dto';
import { GetEntityInvoicesResponseDto } from './dto/get-entity-invoices-response.dto';
import { GetPaidInvoicesResponseDto } from './dto/get-paid-invoices-response.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Invoices')
@Controller('sales/invoices')
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create an invoice' })
  @ApiCookieAuth('cookieAuth')
  @ApiUnauthorizedResponse({ description: 'Access denied' })
  async createInvoice(@Body() body: CreateInvoiceDto, @Req() req) {
    const entityId = getEffectiveEntityId(req);
    console.log("entityId", entityId)
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.invoiceService.createInvoice(body, entityId);
  }

  @Get() 
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get invoices for an entity (with pagination & filters)',
  })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  @ApiOkResponse({ type: GetEntityInvoicesResponseDto })
  async getInvoices(@Req() req, @Query() query: GetInvoicesQueryDto) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.invoiceService.getEntityInvoice(entityId, query);
  }

  @Get('paid')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get paid invoices (paginated + stats)' })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  @ApiOkResponse({ type: GetPaidInvoicesResponseDto })
  async getPaidInvoices(@Req() req, @Query() query: GetPaidInvoicesQueryDto) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.invoiceService.getPaidInvoices(entityId, query);
  }
}
