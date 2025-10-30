import { ApiProperty } from '@nestjs/swagger';

export class PodcastResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ nullable: true })
  coverImageUrl!: string | null;

  @ApiProperty()
  isPublished!: boolean;

  @ApiProperty({ nullable: true })
  publishedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
