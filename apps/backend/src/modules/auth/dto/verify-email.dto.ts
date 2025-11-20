import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'abc123xyz456',
    description: 'Email verification token received via email',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
