import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Web Development', description: 'Updated professional category/niche', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'Updated bio details.', description: 'Updated freelancer bio', required: false })
  @IsString()
  @IsOptional()
  bio?: string;
}
