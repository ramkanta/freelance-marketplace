import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsPositive, Min, MaxLength, MinLength } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Full-Stack React & Node.js Web App' })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'I will build a complete web application with React frontend and Node.js backend.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Web Development' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  category: string;

  @ApiProperty({ example: 5000, description: 'Price in INR (paise not used — whole rupees)' })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ example: 7, description: 'Delivery time in days' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  deliveryDays?: number;
}
