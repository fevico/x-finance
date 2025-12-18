import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { CreateCustomerDto } from './dto/customer.dto';
import { getEffectiveEntityId } from '@/auth/utils/context.util';
import {
  ApiTags,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Customers')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a customer for the current entity' })
  @ApiCookieAuth('cookieAuth')
  @ApiBody({ type: CreateCustomerDto })
  @ApiUnauthorizedResponse({ description: 'Access denied' })
  async createCustomer(@Body() body: CreateCustomerDto, @Req() req) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.customerService.createCustomer(body, entityId);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all customers for the current entity' })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  @ApiOkResponse({ description: 'Customers list with totals' })
  @ApiUnauthorizedResponse({ description: 'Access denied' })
  async getCustersByEntity(@Req() req) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.customerService.getAllCustomer(entityId); 
  }
}
