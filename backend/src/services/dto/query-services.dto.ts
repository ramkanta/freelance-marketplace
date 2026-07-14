import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export const SERVICE_SORT_OPTIONS = ['newest', 'price_low', 'price_high', 'delivery_fast'] as const;
export type ServiceSortOption = (typeof SERVICE_SORT_OPTIONS)[number];

export class QueryServicesDto {
  @ApiPropertyOptional({ example: 'Web Development' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ example: 'react' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 12, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxDeliveryDays?: number;

  @ApiPropertyOptional({ enum: SERVICE_SORT_OPTIONS, example: 'newest' })
  @IsOptional()
  @IsIn(SERVICE_SORT_OPTIONS)
  sortBy?: ServiceSortOption;
}
