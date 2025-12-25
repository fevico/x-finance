import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateCollectionDto {
  @ApiProperty({ example: 'Spring Sale', description: 'Collection name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'spring-sale', description: 'URL slug' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({
    example: {},
    description: 'Image metadata or will be uploaded',
  })
  @IsOptional()
  image?: Record<string, any>;

  @ApiProperty({ example: 'Collection description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  visibility?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}

export class CollectionDto extends CreateCollectionDto {
  @ApiProperty({ example: 'collection_uuid' })
  id: string;

  @ApiProperty({ example: '2025-12-24T00:00:00Z' })
  createdAt: string;
}
