import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEntityDto {
  @ApiProperty({ example: 'Acme Corp', description: 'Entity display name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'group-id-uuid', description: 'Related group id' })
  @IsString()
  @IsNotEmpty()
  groupId: string;
}
