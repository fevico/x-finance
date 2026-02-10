import { IsString, IsInt, IsDate, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentReceivedStatus } from 'prisma/generated/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentReceivedDto {
  @ApiProperty({ example: 'inv_abc123', description: 'Invoice ID' })
  @IsString()
  invoiceId: string;

  @ApiProperty({
    example: 5000,
    description: 'Payment amount in smallest currency unit',
  })
  @IsInt()
  amount: number;

  @ApiProperty({ example: '2026-02-10T00:00:00Z', description: 'Payment date' })
  @IsDate()
  @Type(() => Date)
  paidAt: Date;

  @ApiProperty({
    example: PaymentMethod.Bank_Transfer,
    enum: PaymentMethod,
    description: 'Payment method',
  })
  @IsString()
  paymentMethod: string;

  @ApiProperty({
    example: 'Bank Account - Main',
    description: 'Deposit account/location',
  })
  @IsString()
  depositTo: string;

  @ApiProperty({ example: 'TRF-2026-001', description: 'Reference number' })
  @IsString()
  reference: string;

  @ApiPropertyOptional({
    example: 'Payment received for invoice',
    description: 'Payment note',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    example: PaymentReceivedStatus.Paid,
    enum: PaymentReceivedStatus,
    description: 'Payment status',
  })
  @IsOptional()
  @IsEnum(PaymentReceivedStatus)
  status?: PaymentReceivedStatus;
}

export class UpdatePaymentReceivedDto {
  @ApiPropertyOptional({ example: 5000, description: 'Payment amount' })
  @IsOptional()
  @IsInt()
  amount?: number;

  @ApiPropertyOptional({
    example: '2026-02-10T00:00:00Z',
    description: 'Payment date',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  paidAt?: Date;

  @ApiPropertyOptional({
    example: PaymentMethod.Cash,
    enum: PaymentMethod,
    description: 'Payment method',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({
    example: 'Cash Drawer',
    description: 'Deposit account/location',
  })
  @IsOptional()
  @IsString()
  depositTo?: string;

  @ApiPropertyOptional({
    example: 'CSH-2026-001',
    description: 'Reference number',
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'Updated note', description: 'Payment note' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    example: PaymentReceivedStatus.Partial,
    enum: PaymentReceivedStatus,
    description: 'Payment status',
  })
  @IsOptional()
  @IsEnum(PaymentReceivedStatus)
  status?: PaymentReceivedStatus;
}

export class PaymentReceivedResponseDto extends CreatePaymentReceivedDto {
  @ApiProperty({ example: 'pr_abc123', description: 'Payment record ID' })
  @IsString()
  id: string;

  @ApiProperty({ example: 5000, description: 'Invoice total amount' })
  @IsInt()
  total: number;

  @ApiProperty({ example: 'ent_abc123', description: 'Entity ID' })
  @IsString()
  entityId: string;

  @ApiProperty({
    example: '2026-02-10T00:00:00Z',
    description: 'Created at timestamp',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;
}
