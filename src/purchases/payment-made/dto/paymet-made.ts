import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaymentMethod } from 'prisma/generated/enums';

export class CreatePaymentMade {
  @IsNotEmpty()
  @IsString()
  vendorId: string;

  @IsOptional()
  @IsString()
  billNumber: string;

  @IsNotEmpty()
  @IsDate()
  paymentDate: Date;

  @IsNotEmpty()
  @IsString()
  amount: string;

  @IsNotEmpty()
  @IsString()
  accountId: string;

  @IsOptional()
  @IsString()
  reference?: string;
  @IsOptional()
  @IsString()
  note?: string;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
