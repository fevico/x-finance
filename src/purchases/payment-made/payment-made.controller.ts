import { BadRequestException, Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { PaymentMadeService } from './payment-made.service';
import { AuthGuard } from '@nestjs/passport';
import { getEffectiveEntityId } from '@/auth/utils/context.util';
import { CreatePaymentMade } from './dto/paymet-made';

@Controller('payment-made')
export class PaymentMadeController {
    constructor(private paymentMadeService: PaymentMadeService){}

    @Post()
    @UseGuards(AuthGuard)
    async addPaymentMade (@Body() body: CreatePaymentMade, @Req() req){
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.paymentMadeService.addPaymentMade(body, entityId)
    }
}
