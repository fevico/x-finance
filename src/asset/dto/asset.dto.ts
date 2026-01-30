import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsBoolean, IsDateString } from 'class-validator';

export class CreateAssetDto {
  @ApiProperty({ example: 'Dell laptop', description: 'Name of the asset' })
  @IsString()
  @IsNotEmpty()
  name: string;

    @ApiProperty({ example: 'ComputerEquipment', description: 'Asset type' })
  @IsString()
  @IsNotEmpty()
  type: string;           // e.g. "laptop", "vehicle", "furniture"

    @ApiProperty({ example: 'IT', description: 'Asset Department.' })
  @IsString()
  @IsNotEmpty()
  department: string;

    @ApiProperty({ example: 'John Doe', description: 'Assigned to' })
  @IsString()
  @IsNotEmpty()
  assigned: string;   

    @ApiProperty({ example: 'Short note..', description: 'Description of the asset' })
  @IsString()
  description: string;

    @ApiProperty({ example: '25-03-2024', description: 'Purchase date of the asset' })
  @IsDateString()
  purchaseDate: string;   // ISO string → Prisma converts to DateTime

    @ApiProperty({ example: 5000, description: 'Purchase cost of the asset' })
  @IsInt()
  @Min(0)
  purchaseCost: number;

    @ApiProperty({ example: 10, description: 'Current value of the asset' })
  @IsInt()
  @Min(0)
  currentValue: number;

    @ApiProperty({ example: '25-03-2025', description: 'Expiry date of the asset' })
  @IsDateString()
  expiryDate: string;

    @ApiProperty({ example: 'Straight Line', description: 'Depreciation method' })
  @IsString()
  depreciationMethod: string; 

  @ApiProperty({ example: 5, description: 'Number of years for depreciation' })
  @IsInt()
  @Min(0)
  years: number;

    @ApiProperty({ example: 10, description: 'Salvage value of the asset' })
  @IsInt()
  @Min(0)
  salvageValue: number;
}

export class UpdateAssetDto {
    @ApiPropertyOptional({ example: 'Dell laptop', description: 'Name of the asset' })
  @IsString()
  name?: string;

    @ApiPropertyOptional({ example: 'ComputerEquipment', description: 'Asset type' })
  @IsString()
  type?: string;           // e.g. "laptop", "vehicle", "furniture"

    @ApiPropertyOptional({ example: 'IT', description: 'Asset Department.' })
  @IsString()
  department?: string;

    @ApiPropertyOptional({ example: 'John Doe', description: 'Assigned to' })
  @IsString()
  assigned?: string;   

    @ApiPropertyOptional({ example: 'Short note..', description: 'Description of the asset' })
  @IsString()
  description?: string;
  
    @ApiPropertyOptional({ example: '25-03-2024', description: 'Purchase date of the asset' })
  @IsDateString()
  purchaseDate?: string;   // ISO string → Prisma converts to DateTime

    @ApiPropertyOptional({ example: 5000, description: 'Purchase cost of the asset' })
  @IsInt()
  @Min(0)
  purchaseCost?: number;

    @ApiPropertyOptional({ example: 10, description: 'Current value of the asset' })
  @IsInt()
  @Min(0)
  currentValue?: number;

    @ApiPropertyOptional({ example: '25-03-2025', description: 'Expiry date of the asset' })
  @IsDateString()
  expiryDate?: string;

    @ApiPropertyOptional({ example: 'Straight Line', description: 'Depreciation method' })
  @IsString()
  depreciationMethod?: string; 

  @ApiPropertyOptional({ example: 5, description: 'Number of years for depreciation' })
  @IsInt()
  @Min(0)
  years?: number;

    @ApiPropertyOptional({ example: 10, description: 'Salvage value of the asset' })
  @IsInt()
  @Min(0)
  salvageValue?: number;
}

