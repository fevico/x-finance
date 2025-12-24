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
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/bill.dto';
import { GetBillsQueryDto } from './dto/get-bills-query.dto';
import { GetBillsResponseDto } from './dto/get-bills-response.dto';
import { CreatePaymentDto, PaymentDto } from './dto/payment.dto';
import { Param } from '@nestjs/common';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { Req } from '@nestjs/common';
import { Request } from 'express';
import { getEffectiveEntityId } from '@/auth/utils/context.util';

@ApiTags('Bills')
@Controller('bills')
@UseGuards(AuthGuard)
@ApiBearerAuth()
@ApiCookieAuth()
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post('create')
  @UseInterceptors(FileInterceptor('attachment'))
  @ApiOperation({ summary: 'Create a new bill' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        billDate: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-15T10:00:00Z',
        },
        billNumber: { type: 'string', example: 'INV-001' },
        vendorId: { type: 'string', example: 'vendor-id-123' },
        dueDate: {
          type: 'string',
          format: 'date-time',
          example: '2025-02-15T10:00:00Z',
        },
        poNumber: { type: 'string', example: 'PO-001' },
        paymentTerms: { type: 'string', example: 'Net 30' },
        items: {
          type: 'array',
          items: { type: 'string' },
          example: ['Item 1', 'Item 2'],
        },
        total: { type: 'number', example: 5000 },
        category: { type: 'string', example: 'Office Supplies' },
        notes: { type: 'string', example: 'Important notes' },
        attachment: { type: 'string', format: 'binary' },
      },
      required: [
        'billDate',
        'vendorId',
        'dueDate',
        'paymentTerms',
        'items',
        'total',
        'category',
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Bill created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'bill-id-123' },
        billDate: { type: 'string', format: 'date-time' },
        billNumber: { type: 'string' },
        vendorId: { type: 'string' },
        dueDate: { type: 'string', format: 'date-time' },
        poNumber: { type: 'string' },
        paymentTerms: { type: 'string' },
        items: { type: 'array', items: { type: 'string' } },
        total: { type: 'number' },
        category: { type: 'string' },
        notes: { type: 'string' },
        attachment: { type: 'object' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request or invalid input' })
  async createBill(
    @Body() body: CreateBillDto,
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) {
      throw new BadRequestException('Entity ID is required');
    }

    return this.billsService.createBill(body, entityId, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bills with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by bill number, vendor name, or PO number',
  })
  @ApiResponse({
    status: 200,
    description: 'Bills retrieved successfully',
    type: GetBillsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getBills(
    @Query() query: GetBillsQueryDto,
    @Req() req: Request,
  ): Promise<GetBillsResponseDto> {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) {
      throw new BadRequestException('Entity ID is required');
    }

    return this.billsService.getBills(entityId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bill details by ID' })
  @ApiResponse({ status: 200, description: 'Bill details returned' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async getBillById(@Param('id') id: string, @Req() req: Request) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');

    const bill = await this.billsService.getBillById(entityId, id);
    if (!bill) throw new BadRequestException('Bill not found');
    return bill;
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Create a payment record for a bill' })
  @ApiResponse({
    status: 201,
    description: 'Payment recorded',
    type: PaymentDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createPayment(
    @Param('id') id: string,
    @Body() body: CreatePaymentDto,
    @Req() req: Request,
  ) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.billsService.createPayment(id, entityId, body);
  }
}