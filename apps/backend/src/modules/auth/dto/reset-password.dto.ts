import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'abc123xyz456',
    description: 'Password reset token received via email',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    description: 'New password (minimum 6 characters)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
