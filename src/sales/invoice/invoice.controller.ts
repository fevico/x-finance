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
  Delete,
  Patch,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { getEffectiveEntityId } from '@/auth/utils/context.util';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
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
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiParam,
  ApiBody,
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
    const userId = req.user?.id;
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.invoiceService.createInvoice(body, entityId, userId);
  }

   @Get('analytics')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get invoice analytics (Aging & Revenue)' })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  @ApiOkResponse({ description: 'Invoice analytics data' })
  @ApiUnauthorizedResponse({ description: 'Access denied' })
  async getInvoiceAnalytics(@Req() req) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.invoiceService.getInvoiceAnalytics(entityId);
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
    console.log('hheh')
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

  

  @Get(':invoiceId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get invoice by ID with customer details' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID', type: 'string' })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  @ApiOkResponse({ description: 'Invoice details with customer' })
  @ApiUnauthorizedResponse({ description: 'Access denied' })
  @ApiNotFoundResponse({ description: 'Invoice not found' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to access this invoice',
  })
  async getInvoice(@Req() req, @Param('invoiceId') invoiceId: string) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.invoiceService.getInvoiceById(invoiceId, entityId);
  }

  @Patch(':invoiceId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update an invoice' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID', type: 'string' })
  @ApiBody({ type: UpdateInvoiceDto })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  @ApiOkResponse({ description: 'Invoice updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Access denied' })
  @ApiNotFoundResponse({ description: 'Invoice not found' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to update this invoice',
  })
  async updateInvoice(
    @Req() req,
    @Param('invoiceId') invoiceId: string,
    @Body() body: UpdateInvoiceDto,
  ) {
    const entityId = getEffectiveEntityId(req);
    const userId = req.user?.id;
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.invoiceService.updateInvoice(invoiceId, entityId, body, userId);
  }

  @Delete(':invoiceId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete an invoice (disconnects from customer)' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID', type: 'string' })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  @ApiOkResponse({ description: 'Invoice deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Access denied' })
  @ApiNotFoundResponse({ description: 'Invoice not found' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to delete this invoice',
  })
  async deleteInvoice(@Req() req, @Param('invoiceId') invoiceId: string) {
    const entityId = getEffectiveEntityId(req);
    const userId = req.user?.id;
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.invoiceService.deleteInvoice(invoiceId, entityId, userId);
  }

 
}
