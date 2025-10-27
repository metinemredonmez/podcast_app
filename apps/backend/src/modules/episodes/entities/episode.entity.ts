import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('episode')
export class EpisodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  name?: string;
}
