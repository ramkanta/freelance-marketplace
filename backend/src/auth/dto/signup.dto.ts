import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com', description: 'The email address of the user' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: 'securePassword123', description: 'The password for the account' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @ApiProperty({
    example: 'customer',
    description: 'Role of the user',
    enum: ['customer', 'freelancer', 'support', 'admin'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['customer', 'freelancer', 'support', 'admin'], {
    message: 'Role must be one of: customer, freelancer, support, admin',
  })
  role?: 'customer' | 'freelancer' | 'support' | 'admin';
}
