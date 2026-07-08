import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignDisputeDto {
  @ApiProperty({ description: 'User ID of the support agent to assign this dispute to' })
  @IsUUID()
  supportAgentId: string;
}
