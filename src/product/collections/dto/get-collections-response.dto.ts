import { ApiProperty } from '@nestjs/swagger';
import { CollectionDto } from './create-collection.dto';

export class GetCollectionsResponseDto {
  @ApiProperty({ type: [CollectionDto], description: 'List of collections' })
  collections: CollectionDto[];

  @ApiProperty({
    example: 25,
    description: 'Total number of collections matching the filter',
  })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  currentPage: number;

  @ApiProperty({ example: 10, description: 'Items per page' })
  pageSize: number;

  @ApiProperty({ example: 3, description: 'Total number of pages' })
  totalPages: number;
}
