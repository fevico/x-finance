import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ItemsType } from 'prisma/generated/enums';

export class CreateItemDto {
  @ApiProperty({ example: 'Office Chair', description: 'Item name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Furniture', description: 'Item category' })
  @IsString()
  category: string;

  @ApiPropertyOptional({
    example: 'SKU-001',
    description: 'Stock keeping unit',
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 'pieces', description: 'Unit of measure' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({
    example: 'Comfortable office chair for work',
    description: 'Item description',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    example: 25000,
    description: 'Selling price in cents',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sellingPrice?: number;

  @ApiPropertyOptional({ example: 15000, description: 'Cost price in cents' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  costPrice?: number;

  @ApiPropertyOptional({ example: 10, description: 'Tax rate percentage' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  rate?: number;

  @ApiPropertyOptional({ example: true, description: 'Is item taxable' })
  @IsOptional()
  @IsBoolean()
  taxable?: boolean;

  @ApiPropertyOptional({ example: 50, description: 'Current stock quantity' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  currentStock?: number;

  @ApiPropertyOptional({ example: 10, description: 'Low stock threshold' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  lowStock?: number;

  @ApiPropertyOptional({
    enum: ItemsType,
    example: 'product',
    description: 'Item type',
  })
  @IsOptional()
  @IsEnum(ItemsType)
  type?: ItemsType;
}

export class ItemDto extends CreateItemDto {
  @ApiProperty({ example: 'item_uuid' })
  id: string;

  @ApiProperty({
    example: 'in_stock',
    enum: ['in_stock', 'out_of_stock'],
    description: 'Stock status based on currentStock vs lowStock',
  })
  status: 'in_stock' | 'out_of_stock';

  @ApiPropertyOptional({
    example: 25000,
    description: 'Unit price (sellingPrice)',
  })
  unitPrice?: number;
}
