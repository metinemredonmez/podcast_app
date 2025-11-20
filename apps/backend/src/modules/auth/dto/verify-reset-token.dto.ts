import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyResetTokenDto {
  @ApiProperty({
    example: 'abc123xyz456',
    description: 'Password reset token to verify',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
