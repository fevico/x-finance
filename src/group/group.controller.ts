import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { systemRole } from 'prisma/generated/enums';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';

@ApiTags('Groups')
@UseGuards(AuthGuard)
@ApiBearerAuth('jwt')
@ApiCookieAuth('cookieAuth')
@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(systemRole.superadmin)
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({ status: 201, description: 'Group created' })
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupService.create(createGroupDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(systemRole.superadmin)
  @ApiOperation({ summary: 'List groups' })
  @ApiResponse({ status: 200, description: 'List of groups' })
  findAll() {
    return this.groupService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(systemRole.admin)
  @ApiOperation({ summary: 'Get group by id' })
  @ApiResponse({ status: 200, description: 'Group detail' })
  findOne(@Param('id') id: string) {
    return this.groupService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(systemRole.admin)
  @ApiOperation({ summary: 'Update group' })
  @ApiResponse({ status: 200, description: 'Group updated' })
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupService.update(id, updateGroupDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(systemRole.superadmin)
  @ApiOperation({ summary: 'Delete group' })
  @ApiResponse({ status: 200, description: 'Group removed' })
  remove(@Param('id') id: string) {
    return this.groupService.remove(id);
  }
}
