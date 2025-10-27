import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('podcast')
export class PodcastEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  name?: string;
}
