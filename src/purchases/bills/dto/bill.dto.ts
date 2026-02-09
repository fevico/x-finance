import { IsString, IsOptional, IsArray, IsInt, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiProperty({ example: ['item 1', 'item 2'], description: 'Bill items' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  items: string[];

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
