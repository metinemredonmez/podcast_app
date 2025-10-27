import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('follow')
export class FollowEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  name?: string;
}
