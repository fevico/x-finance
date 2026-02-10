import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAccountDto {
  @ApiProperty({ example: 'Cash on Hand', description: 'Name of the account' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '1100', description: 'Account code or ID' })
  @IsString()
  @IsNotEmpty()
  code: string; // e.g. "1100", "4100-01", etc.

  @ApiProperty({ example: 'Asset', description: 'Category of the account' })
  @IsString()
  @IsNotEmpty()
  category: string; // e.g. "Asset", "Liability", "Equity", "Revenue", "Expense"

  @ApiProperty({
    example: 'Current Asset',
    description: 'Sub-category of the account',
  })
  @IsString()
  @IsNotEmpty()
  subCategory: string; // e.g. "Current Asset", "Operating Expense", "Sales Revenue"

  @ApiProperty({
    example: 'Main cash account for daily transactions',
    description: 'Description of the account',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Asset', description: 'Type of the account' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 1500, description: 'Current balance of the account' })
  @IsInt()
  @IsOptional()
  credit?: number;

  @ApiProperty({ example: 500, description: 'Current balance of the account' })
  @IsInt()
  @IsOptional()
  debit?: number;

  @ApiProperty({
    example: '2024-12-31',
    description: 'Opening date or last transaction date',
  })
  @IsDateString()
  @IsOptional()
  date?: string; // opening date or last transaction date
}

export class UpdateAccountDto extends PartialType(CreateAccountDto) {}

export class AccountResponseDto {
  @ApiProperty({
    example: 'acc_abc123',
    description: 'Unique identifier for the account',
  })
  id: string;
  @ApiProperty({ example: 'Cash on Hand', description: 'Name of the account' })
  name: string;
  @ApiProperty({ example: '1100', description: 'Account code or ID' })
  code: string;
  @ApiProperty({ example: 'Asset', description: 'Category of the account' })
  category: string;
  @ApiProperty({
    example: 'Current Asset',
    description: 'Sub-category of the account',
  })
  subCategory: string;
  @ApiProperty({
    example: 'Main cash account for daily transactions',
    description: 'Description of the account',
  })
  description: string;
  @ApiProperty({ example: 'Asset', description: 'Type of the account' })
  type: string;
  @ApiProperty({ example: 1500, description: 'Current balance of the account' })
  balance: number;
  @ApiProperty({
    example: 500,
    description: 'Current debit balance of the account',
  })
  credit?: number | null;
  @ApiProperty({
    example: 200,
    description: 'Current credit balance of the account',
  })
  debit?: number | null;
  @ApiProperty({
    example: '2024-12-31',
    description: 'Opening date or last transaction date',
  })
  @Transform(({ value }) => (value ? value.toISOString() : null))
  date?: Date | null;
  @ApiProperty({ example: 'ent_abc123', description: 'Associated entity ID' })
  entityId: string;
  @ApiProperty({
    example: '2024-01-01T12:00:00.000Z',
    description: 'Account creation timestamp',
  })
  @Transform(({ value }) => value.toISOString())
  createdAt: Date;
}

export class OpeningBalanceDto {
  lines: {
    accountId: string;
    debit: number;
    credit: number;
  }[];
}
