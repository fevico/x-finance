import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ example: 'Engineering', description: 'Group name' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
