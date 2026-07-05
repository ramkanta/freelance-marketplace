import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com', description: 'The email address of the user' })
  email: string;

  @ApiProperty({ example: 'securePassword123', description: 'The password for the account' })
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  name: string;

  @ApiProperty({
    example: 'customer',
    description: 'Role of the user',
    enum: ['customer', 'freelancer', 'support', 'admin'],
    required: false,
  })
  role?: 'customer' | 'freelancer' | 'support' | 'admin';
}
