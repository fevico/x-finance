import {
  IsString,
  IsDate,
  IsOptional,
  IsInt,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus } from 'prisma/generated/enums';

// Invoice Item DTO (shared between Create and Update)
export class InvoiceItemDto {
  @IsOptional()
  @IsString()
  id?: string; // If provided, it's an update; if missing, it's a new item

  @IsString()
  itemId: string;

  @IsNumber()
  rate: number;

  @IsNumber()
  quantity: number;
}

// Create Invoice DTO (for creating a new invoice)
export class CreateInvoiceDto {
  @IsString()
  customerId: string;

  @IsDate()
  @Type(() => Date)
  invoiceDate: Date;

  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsString()
  paymentTerms: string;

  @IsString()
  currency: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsInt()
  total: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}

// Update Invoice DTO (for partial updates with item management)
export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  invoiceDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeItemIds?: string[]; // IDs of invoice items to remove

  @IsOptional()
  @IsInt()
  total?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}

// Response DTO (for returning invoice data, includes id)
export class InvoiceDto extends CreateInvoiceDto {
  @IsString()
  id: string;

  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}