import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Web Development', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'Updated bio details.', required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: 'https://myportfolio.com', required: false })
  @IsOptional()
  @IsUrl()
  portfolio_url?: string;
}
