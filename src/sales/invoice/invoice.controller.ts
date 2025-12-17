import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { getEffectiveEntityId } from '@/auth/utils/context.util';
import { CreateInvoiceDto } from './dto/invoice.dto';

@Controller('invoice')
export class InvoiceController {
    constructor(private invoiceService:InvoiceService){}

    @Post('create')
    @UseGuards(AuthGuard)
    async createInvoice(@Body() body: CreateInvoiceDto, @Req() req){
      const entityId = getEffectiveEntityId(req)
    if(!entityId) throw new UnauthorizedException("Access denied!")
      return this.invoiceService.createInvoice(body, entityId)
    }
}
