import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'The service/gig being booked' })
  @IsUUID()
  serviceId: string;
}
