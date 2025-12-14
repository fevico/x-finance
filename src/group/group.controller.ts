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

@UseGuards(AuthGuard)
@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(systemRole.superadmin)
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupService.create(createGroupDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(systemRole.superadmin)
  findAll() {
    return this.groupService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(systemRole.admin)
  findOne(@Param('id') id: string) {
    return this.groupService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(systemRole.admin)
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupService.update(id, updateGroupDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(systemRole.superadmin)
  remove(@Param('id') id: string) {
    return this.groupService.remove(id);
  }
}
