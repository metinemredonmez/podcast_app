import { ApiProperty } from '@nestjs/swagger';

class PodcastEpisodeSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  duration!: number;

  @ApiProperty()
  isPublished!: boolean;

  @ApiProperty({ nullable: true })
  publishedAt!: Date | null;
}

class PodcastOwnerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true })
  name!: string | null;
}

class PodcastCategorySummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

export class PodcastDetailDto {
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

  @ApiProperty({ type: PodcastOwnerDto })
  owner!: PodcastOwnerDto;

  @ApiProperty({ type: () => [PodcastEpisodeSummaryDto] })
  episodes!: PodcastEpisodeSummaryDto[];

  @ApiProperty({ type: () => [PodcastCategorySummaryDto] })
  categories!: PodcastCategorySummaryDto[];
}
