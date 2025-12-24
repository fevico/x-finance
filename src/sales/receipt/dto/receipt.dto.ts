import {
  IsString,
  IsDate,
  IsArray,
  IsInt,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from 'prisma/generated/enums';

export class CreateReceiptDto {
  @ApiProperty({ example: '1234567890', description: 'Customer ID' })
  @IsString()
  customerId: string;

  @ApiProperty({ example: '2025-12-18T00:00:00Z', description: 'Receipt date' })
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiProperty({
    example: PaymentMethod.Cash,
    enum: PaymentMethod,
    description: 'Payment method',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: ['item 1', 'item 2'], description: 'List of items' })
  @IsArray()
  @IsString({ each: true })
  items: string[];

  @ApiProperty({
    example: 5000,
    description: 'Total amount in smallest currency unit',
  })
  @IsInt()
  total: number;
}

export class UpdateReceiptDto {
  @ApiPropertyOptional({ example: 'Jane Doe', description: 'Customer name' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({
    example: '2025-12-18T00:00:00Z',
    description: 'Receipt date',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;

  @ApiPropertyOptional({
    example: PaymentMethod.Cash,
    enum: PaymentMethod,
    description: 'Payment method',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: ['item 1'], description: 'List of items' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  items?: string[];

  @ApiPropertyOptional({
    example: 5000,
    description: 'Total amount in smallest currency unit',
  })
  @IsOptional()
  @IsInt()
  total?: number;
}

export class ReceiptDto extends CreateReceiptDto {
  @ApiProperty({ example: 'rec_abc123', description: 'Receipt id' })
  @IsString()
  id: string;

  @ApiProperty({
    example: '2025-12-18T00:00:00Z',
    description: 'Created at timestamp',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;
}
