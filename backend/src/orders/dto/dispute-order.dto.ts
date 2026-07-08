import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class DisputeOrderDto {
  @ApiProperty({ description: 'Reason for filing the dispute' })
  @IsString()
  @MinLength(10)
  reason: string;
}
