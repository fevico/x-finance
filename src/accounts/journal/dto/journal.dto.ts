import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class JournalLineDto {
  @ApiProperty({ example: 'CASH-001', description: 'Account code or ID' })
  @IsString()
  @IsNotEmpty()
  account: string;

  @ApiProperty({ example: 15000, description: 'Debit amount (positive number)' })
  @ApiPropertyOptional()
  debit?: number;

  @ApiProperty({ example: 0, description: 'Credit amount (positive number)' })
  @ApiPropertyOptional()
  credit?: number;
}

export class CreateJournalDto {
  @ApiProperty({ example: 'Payment for office rent' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '2025-01-15' })
  @IsDateString()
  date: string; // will be converted to DateTime

  @ApiProperty({
    type: [JournalLineDto],
    description: 'Array of journal entry lines (at least one debit and one credit usually)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];

  @ApiProperty({ example: 'comp_abc123' })
  @IsString()
  @IsNotEmpty()
  entityId: string;
}

export class UpdateJournalDto {
  @ApiPropertyOptional({ example: 'Payment for office rent - corrected' })
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2025-01-16' })
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    type: [JournalLineDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines?: JournalLineDto[];

  @ApiPropertyOptional({ example: 'INV-2025015-004' })
  @IsString()
  reference?: string;
}