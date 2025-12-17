import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { CreateCustomerDto } from './dto/customer.dto';
import { getEffectiveEntityId } from '@/auth/utils/context.util';

@Controller('customer')
export class CustomerController {
    constructor(private readonly customerService: CustomerService){}

    @Post('create')
    @UseGuards(AuthGuard)
    async createCustomer(@Body() body: CreateCustomerDto, @Req() req){
        const entityId = getEffectiveEntityId(req)
        if(!entityId) throw new UnauthorizedException("Access denied!")
            return this.customerService.createCustomer(body, entityId)
    }

    @Get()
    @UseGuards(AuthGuard)
    async getCustersByEntity(@Req() req){
    const entityId = getEffectiveEntityId(req)
    if(!entityId) throw new UnauthorizedException("Access denied!")
        return this.customerService.getAllCustomer(entityId)
    }
}
