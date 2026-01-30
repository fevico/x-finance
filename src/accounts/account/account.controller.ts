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
import { AccountService } from './account.service';
import {
  AccountResponseDto,
  CreateAccountDto,
  UpdateAccountDto,
} from './dto/account.dto';
import { getEffectiveEntityId } from '@/auth/utils/context.util';
import { Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/auth/guards/auth.guard';

@ApiTags('Account')
@Controller('account')
@UseGuards(AuthGuard)
@ApiBearerAuth()
@ApiCookieAuth()
export class AccountController {
  constructor(private accountsService: AccountService) {}
  @Post()
    @ApiOperation({ summary: 'Create a new account' })
    @ApiBody({ type: CreateAccountDto })
    @ApiResponse({ status: 201, description: 'Account created' })
  async create(@Body() account: CreateAccountDto, @Req() req: Request) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.accountsService.create(account, entityId);
  }

  @Get()
    @ApiOperation({ summary: 'Get all accounts for the entity' })
    @ApiResponse({ status: 200, description: 'List of accounts', type: AccountResponseDto, isArray: true })
    @ApiResponse({ status: 400, description: 'Bad request' })
  async findAll(@Req() req: Request): Promise<AccountResponseDto[]> {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.accountsService.findAll(entityId);
  }

//   @Patch(':id')
//   async update(@Param('id') id: string, @Body() account: UpdateAccountDto) {
//     return this.accountsService.update(id, account);
//   }          

//   @Get(':id')
//   async findOne(@Param('id') id: string): Promise<AccountResponseDto> {
//       return this.accountsService.findOne(id);
//   }
}
