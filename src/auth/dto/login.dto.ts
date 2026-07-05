import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'The email address of the user' })
  email: string;

  @ApiProperty({ example: 'securePassword123', description: 'The password for the account' })
  password: string;
}
