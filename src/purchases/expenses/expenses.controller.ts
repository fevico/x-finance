import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExpensesService } from './expenses.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { getEffectiveEntityId } from '@/auth/utils/context.util';
import { CreateExpenseDto } from './dto/expense.dto';
import { GetExpensesQueryDto } from './dto/get-expenses-query.dto';
import { GetExpensesResponseDto } from './dto/get-expenses-response.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Expenses')
@Controller('purchases/expenses')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('attachment'))
  @ApiOperation({ summary: 'Create an expense with optional file attachment' })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        date: { type: 'string', format: 'date-time' },
        reference: { type: 'string' },
        supplier: { type: 'string' },
        category: { type: 'string' },
        paymentMethod: {
          type: 'string',
          enum: ['Cash', 'Card', 'Transfer', 'Check'],
        },
        account: { type: 'string' },
        amount: { type: 'integer' },
        tax: { type: 'string' },
        description: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        attachment: { type: 'string', format: 'binary' },
      },
      required: [
        'date',
        'reference',
        'supplier',
        'category',
        'paymentMethod',
        'account',
        'amount',
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Access denied' })
  async createExpense(
    @Body() body: CreateExpenseDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req,
  ) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.expensesService.createExpense(
      {
        ...body,
        amount: body.amount ? Number(body.amount) : 0,
        tags: body.tags
          ? Array.isArray(body.tags)
            ? body.tags
            : [body.tags]
          : [],
      },
      entityId,
      file,
    );
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'List expenses for the entity (pagination + search)',
  })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  @ApiOkResponse({ type: GetExpensesResponseDto })
  @ApiUnauthorizedResponse({ description: 'Access denied' })
  async getExpenses(@Req() req, @Query() query: GetExpensesQueryDto) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.expensesService.getExpenses(entityId, query);
  }
}
