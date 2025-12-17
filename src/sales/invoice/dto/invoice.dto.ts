import { IsString, IsDate, IsOptional, IsInt, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus } from 'prisma/generated/enums';

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
  @IsString({ each: true })
  items: string[];

  @IsInt()
  total: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}

// Update Invoice DTO (for partial updates)
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
  @IsString({ each: true })
  items?: string[];

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