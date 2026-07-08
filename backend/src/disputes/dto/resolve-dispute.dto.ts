import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class ResolveDisputeDto {
  @ApiProperty({
    enum: ['resolved_refund', 'resolved_release', 'resolved_split'],
    description:
      'resolved_refund = full refund to customer | resolved_release = full release to freelancer | resolved_split = partial split',
  })
  @IsIn(['resolved_refund', 'resolved_release', 'resolved_split'])
  resolution: 'resolved_refund' | 'resolved_release' | 'resolved_split';

  @ApiPropertyOptional({ description: 'Required when resolution=resolved_split. Customer refund percentage (0–100).' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  customerRefundPercent?: number;

  @ApiPropertyOptional({ description: 'Internal note recorded by the support agent.' })
  @IsOptional()
  @IsString()
  resolutionNote?: string;
}
