import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches, IsEnum, IsOptional } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com', description: 'The email address of the user' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: 'SecurePass123', description: 'The password for the account — min 8 chars, at least one uppercase, one lowercase, one number' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @ApiProperty({
    example: 'customer',
    description: 'Role of the user. Only self-service roles are allowed here — admin/support accounts are provisioned separately.',
    enum: ['customer', 'freelancer'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['customer', 'freelancer'], {
    message: 'Role must be one of: customer, freelancer',
  })
  role?: 'customer' | 'freelancer';
}
