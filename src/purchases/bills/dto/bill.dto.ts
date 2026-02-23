import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsDate,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BillItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Office Supplies', description: 'Item description/name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 1000, description: 'Rate per unit' })
  @IsNumber()
  rate: number;

  @ApiProperty({ example: 2, description: 'Quantity' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 'acc-expense-123', description: 'Expense account ID for this item' })
  @IsString()
  expenseAccountId: string;
}

export class CreateBillDto {
  @ApiProperty({ example: '2025-12-24T00:00:00Z', description: 'Bill date' })
  @IsDate()
  @Type(() => Date)
  billDate: Date;

  @ApiPropertyOptional({ example: 'BILL-001', description: 'Bill number' })
  @IsOptional()
  @IsString()
  billNumber?: string;

  @ApiProperty({ example: 'vendor_uuid', description: 'Vendor ID' })
  @IsString()
  vendorId: string;

  @ApiProperty({ example: '2025-01-24T00:00:00Z', description: 'Due date' })
  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @ApiPropertyOptional({
    example: 'PO-123',
    description: 'Purchase order number',
  })
  @IsOptional()
  @IsString()
  poNumber?: string;

  @ApiProperty({ example: 'Net 30', description: 'Payment terms' })
  @IsString()
  paymentTerms: string;

  @ApiProperty({ type: [BillItemDto], description: 'Bill items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  })
  items: BillItemDto[];

  @ApiProperty({ example: 50000, description: 'Total amount' })
  @Type(() => Number)
  total: number;

  @ApiProperty({ example: 'Office Supplies', description: 'Category' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ example: 'Payment terms noted', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
  @ApiPropertyOptional({ example: '10000', description: 'Discount' })
  @IsOptional()
  @IsString()
  discount?: string;
  @ApiPropertyOptional({ example: '10000', description: 'Tax' })
  @IsOptional()
  @IsString()
  tax?: string;
}

export class UpdateBillDto {
  @ApiPropertyOptional({
    example: '2025-12-24T00:00:00Z',
    description: 'Bill date',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  billDate?: Date;

  @ApiPropertyOptional({ example: 'BILL-001', description: 'Bill number' })
  @IsOptional()
  @IsString()
  billNumber?: string;

  @ApiPropertyOptional({ example: 'vendor_uuid', description: 'Vendor ID' })
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiPropertyOptional({
    example: '2025-01-24T00:00:00Z',
    description: 'Due date',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @ApiPropertyOptional({
    example: 'PO-123',
    description: 'Purchase order number',
  })
  @IsOptional()
  @IsString()
  poNumber?: string;

  @ApiPropertyOptional({ example: 'Net 30', description: 'Payment terms' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional({ type: [BillItemDto], description: 'Bill items' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  })
  items?: BillItemDto[];

  @ApiPropertyOptional({
    example: ['item_1'],
    description: 'IDs of items to remove',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  })
  removeItemIds?: string[];

  @ApiPropertyOptional({ example: 50000, description: 'Total amount' })
  @IsOptional()
  @Type(() => Number)
  total?: number;

  @ApiPropertyOptional({ example: 'Office Supplies', description: 'Category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Payment terms noted', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: '10000', description: 'Discount' })
  @IsOptional()
  @IsString()
  discount?: string;
  @ApiPropertyOptional({ example: '10000', description: 'Tax' })
  @IsOptional()
  @IsString()
  tax?: string;
}

export class BillDto extends CreateBillDto {
  @ApiProperty({ example: 'bill_uuid', description: 'Bill ID' })
  id: string;

  @ApiPropertyOptional({
    example: { publicId: 'bill/file', secureUrl: 'https://...' },
  })
  attachment?: Record<string, any>;

  @ApiProperty({ example: '2025-12-24T00:00:00Z' })
  createdAt: string;
}
