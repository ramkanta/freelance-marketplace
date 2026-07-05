import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateProfileDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'The user ID this profile belongs to' })
  @IsUUID(4, { message: 'User ID must be a valid UUID' })
  userId: string;

  @ApiProperty({ example: 'Graphic Design', description: 'Professional category/niche' })
  @IsString()
  @IsNotEmpty({ message: 'Category is required' })
  category: string;

  @ApiProperty({ example: 'Specialized in brand identity and vector logo design.', description: 'Brief freelancer bio', required: false })
  @IsString()
  @IsOptional()
  bio?: string;
}
