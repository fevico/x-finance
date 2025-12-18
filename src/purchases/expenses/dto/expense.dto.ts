import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsInt,
  IsDate,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from 'prisma/generated/enums';

export class CreateExpenseDto {
  @ApiProperty({ example: '2025-12-18T00:00:00Z', description: 'Expense date' })
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiProperty({ example: 'EXP-001', description: 'Reference number' })
  @IsString()
  reference: string;

  @ApiProperty({ example: 'Acme Supplies', description: 'Supplier name' })
  @IsString()
  supplier: string;

  @ApiProperty({ example: 'Office Supplies', description: 'Expense category' })
  @IsString()
  category: string;

  @ApiProperty({
    example: PaymentMethod.Cash,
    enum: PaymentMethod,
    description: 'Payment method',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 'Cash Register', description: 'Account used' })
  @IsString()
  account: string;

  @ApiProperty({
    example: 5000,
    description: 'Amount in smallest currency unit',
  })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: '500', description: 'Tax amount' })
  @IsString()
  tax: string;

  @ApiPropertyOptional({
    example: 'Office supplies purchase',
    description: 'Description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ['office', 'supplies'], description: 'Tags' })
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}

export class ExpenseDto extends CreateExpenseDto {
  @ApiProperty({ example: 'exp_cuid', description: 'Expense id' })
  id: string;

  @ApiPropertyOptional({
    example: { publicId: 'exp/file', secureUrl: 'https://...' },
    description: 'Attachment info',
  })
  attachment?: Record<string, any>;

  @ApiProperty({ example: '2025-12-18T00:00:00Z', description: 'Created at' })
  createdAt: string;
}
