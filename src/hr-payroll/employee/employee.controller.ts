import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmployeeService } from './employee.service';
import {
  CreateEmployeeDto,
  EmployeeResponseDto,
  EmployeeStatsDto,
} from './dto/employee.dto';
import { getEffectiveEntityId } from '@/auth/utils/context.util';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@/auth/guards/auth.guard';

@ApiTags('Employee')
@Controller('employee')
@UseGuards(AuthGuard)
@ApiBearerAuth()
@ApiCookieAuth()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @UseInterceptors(FileInterceptor('profileImage'))
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Employee data with optional profile image',
    type: CreateEmployeeDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Employee created',
    type: EmployeeResponseDto,
  })
  async create(
    @Body() employeeData: CreateEmployeeDto,
    @UploadedFile() profileImage: Express.Multer.File,
    @Req() req: Request,
  ): Promise<EmployeeResponseDto> {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.employeeService.create(employeeData, profileImage, entityId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all employees for the entity with stats' })
  @ApiResponse({
    status: 200,
    description: 'Employees retrieved',
    schema: {
      type: 'object',
      properties: {
        employees: {
          type: 'array',
          items: { $ref: '#/components/schemas/EmployeeResponseDto' },
        },
        stats: { $ref: '#/components/schemas/EmployeeStatsDto' },
      },
    },
  })
  async findAll(
    @Req() req: Request,
  ): Promise<{ employees: EmployeeResponseDto[]; stats: EmployeeStatsDto }> {
    const entityId = getEffectiveEntityId(req);
    if (!entityId) throw new BadRequestException('Entity ID is required');
    return this.employeeService.findAll(entityId);
  }
}
