import { IsString, IsDate, IsArray, IsOptional, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOpeningBalanceItemDto {
  @IsString()
  accountId: string;

  @IsInt()
  debit: number = 0;

  @IsInt()
  credit: number = 0;
}

export class CreateOpeningBalanceDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  @IsOptional()
  fiscalYear?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOpeningBalanceItemDto)
  items: CreateOpeningBalanceItemDto[];
}

export class UpdateOpeningBalanceDto {
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  date?: Date;

  @IsString()
  @IsOptional()
  fiscalYear?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOpeningBalanceItemDto)
  @IsOptional()
  items?: CreateOpeningBalanceItemDto[];
}

export class OpeningBalanceDto {
  id: string;
  entityId: string;
  date: Date;
  fiscalYear?: string;
  totalCredit: number;
  totalDebit: number;
  difference: number;
  status: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class OpeningBalanceItemDto {
  id: string;
  openingBalanceId: string;
  accountId: string;
  debit: number;
  credit: number;
  createdAt: Date;
  updatedAt: Date;
}

export class GetOpeningBalanceResponseDto extends OpeningBalanceDto {
  items: OpeningBalanceItemDto[];
}
