import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ minLength: 1, maxLength: 2000 })
  @IsString()
  @Length(1, 2000)
  content!: string;
}
