import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('play-event')
export class PlayEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  name?: string;
}
