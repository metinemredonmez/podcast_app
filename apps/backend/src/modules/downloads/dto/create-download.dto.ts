import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDownloadDto {
  @ApiProperty({ example: 'abc-123-def', description: 'Episode ID to download' })
  @IsNotEmpty()
  @IsString()
  episodeId: string;
}
