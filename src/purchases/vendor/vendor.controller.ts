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
import { VendorService } from './vendor.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { getEffectiveEntityId } from '@/auth/utils/context.util';
import { CreateVendorDto } from './dto/vendor.dto';
import { GetVendorsQueryDto } from './dto/get-vendors-query.dto';
import { GetVendorsResponseDto } from './dto/get-vendors-response.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Vendors')
@Controller('vendors')
export class VendorController {
  constructor(private vendorService: VendorService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a vendor for the current entity' })
  @ApiBody({ type: CreateVendorDto })
  @ApiUnauthorizedResponse({ description: 'Access denied' })
  async create(@Body() body: CreateVendorDto, @Req() req) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.vendorService.createVendor(body, entityId);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'List vendors for the entity (pagination + search)',
  })
  @ApiBearerAuth('jwt')
  @ApiCookieAuth('cookieAuth')
  @ApiOkResponse({ type: GetVendorsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Access denied' })
  async getVendors(@Req() req, @Query() query: GetVendorsQueryDto) {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new UnauthorizedException('Access denied!');
    return this.vendorService.getVendors(entityId, query);
  }
}
