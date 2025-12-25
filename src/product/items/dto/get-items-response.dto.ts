import { ApiProperty } from '@nestjs/swagger';
import { ItemDto } from './create-item.dto';

export class GetItemsResponseDto {
  @ApiProperty({
    type: [ItemDto],
    description: 'List of items with stock status and unit price',
  })
  items: ItemDto[];

  @ApiProperty({ example: 50, description: 'Total number of items' })
  total: number;

  @ApiProperty({
    example: 45,
    description: 'Total items in stock (currentStock > lowStock)',
  })
  totalInStock: number;

  @ApiProperty({
    example: 5,
    description: 'Total items out of stock (currentStock <= lowStock)',
  })
  totalOutOfStock: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  currentPage: number;

  @ApiProperty({ example: 10, description: 'Items per page' })
  pageSize: number;

  @ApiProperty({ example: 5, description: 'Total number of pages' })
  totalPages: number;
}
