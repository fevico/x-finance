import { IsString, IsEmail, IsNotEmpty, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100) // Adjust as needed
  type: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10) // e.g., for phone format
  @MaxLength(20)
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  companyName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(10)
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  paymentTerms: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  creditLimit: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsString()
  @IsNotEmpty()
  entityId: string;
}