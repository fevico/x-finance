import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BankingService } from './banking.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { BankAccountDto } from './dto/bank-account.dto';
import { getEffectiveEntityId } from '@/auth/utils/context.util';
import { AuthGuard } from '@/auth/guards/auth.guard';

@ApiTags('Banking')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('banking')
export class BankingController {
  constructor(private readonly bankingService: BankingService) {}

  @Post('accounts')
  @ApiOperation({
    summary: 'Create a new bank account',
    description:
      'Create a new bank account and auto-link to Cash and Cash Equivalents account',
  })
  @ApiBody({ type: CreateBankAccountDto })
  @ApiResponse({ status: 201, type: BankAccountDto })
  async createBankAccount(
    @Body() createBankAccountDto: CreateBankAccountDto,
    @Req() req: any,
  ) {
    const effectiveEntityId = getEffectiveEntityId(req);
    return this.bankingService.createBankAccount(
      createBankAccountDto,
      effectiveEntityId,
    );
  }

  @Get('/accounts')
  @ApiOperation({
    summary: 'Get all bank accounts',
    description: 'Retrieve paginated list of bank accounts for the entity',
  })
  @ApiResponse({ status: 200, type: BankAccountDto, isArray: true })
  async getBankAccounts(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
@Req() req: any,) {
    const effectiveEntityId = getEffectiveEntityId(req);
    return this.bankingService.getBankAccounts(
      effectiveEntityId,
      page,
      pageSize,
    );
  }

  @Get('/accounts/:id')
  @ApiOperation({
    summary: 'Get bank account details',
    description: 'Retrieve full details of a specific bank account',
  })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, type: BankAccountDto })
  async getBankAccountById(
    @Param('id') id: string,
@Req() req: any,) {
        const effectiveEntityId = getEffectiveEntityId(req);

    return this.bankingService.getBankAccountById(id, effectiveEntityId);
  }

  @Patch('/accounts/:id')
  @ApiOperation({
    summary: 'Update bank account',
    description: 'Update bank account details',
  })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateBankAccountDto })
  @ApiResponse({ status: 200, type: BankAccountDto })
  async updateBankAccount(
    @Param('id') id: string,
    @Body() updateBankAccountDto: UpdateBankAccountDto,
@Req() req: any,) {
        const effectiveEntityId = getEffectiveEntityId(req);

    return this.bankingService.updateBankAccount(
      id,
      updateBankAccountDto,
      effectiveEntityId,
    );
  }

  @Delete('/accounts/:id')
  @ApiOperation({
    summary: 'Delete bank account',
    description: 'Delete a bank account (cannot have transactions)',
  })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200 })
  async deleteBankAccount(
    @Param('id') id: string,
@Req() req: any,) {
        const effectiveEntityId = getEffectiveEntityId(req);

    return this.bankingService.deleteBankAccount(id, effectiveEntityId);
  }

  @Post('/accounts/:id/transactions')
  @ApiOperation({
    summary: 'Add transaction to bank account',
    description: 'Record a new transaction for a bank account',
  })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        date: { type: 'string', format: 'date-time' },
        description: { type: 'string' },
        category: { type: 'string' },
        amount: { type: 'number' },
        type: { enum: ['credit', 'debit'] },
        reference: { type: 'string' },
        metadata: { type: 'object' },
      },
      required: ['date', 'description', 'amount', 'type'],
    },
  })
  @ApiResponse({ status: 201 })
  async addTransaction(
    @Param('id') id: string,
    @Body()
    transactionData: {
      date: Date;
      description: string;
      category?: string;
      amount: number;
      type: 'credit' | 'debit';
      reference?: string;
      metadata?: any;
    },
@Req() req: any,) {
        const effectiveEntityId = getEffectiveEntityId(req);

    return this.bankingService.addTransaction(
      id,
      transactionData,
      effectiveEntityId,
    );
  }

  @Get('/accounts/:id/transactions')
  @ApiOperation({
    summary: 'Get bank account transactions',
    description: 'Retrieve paginated list of transactions for a bank account',
  })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, isArray: true })
  async getTransactions(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
@Req() req: any,) {
        const effectiveEntityId = getEffectiveEntityId(req);

    return this.bankingService.getTransactions(
      id,
      effectiveEntityId,
      page,
      pageSize,
    );
  }
}
