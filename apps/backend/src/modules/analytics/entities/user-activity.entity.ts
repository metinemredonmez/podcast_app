import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user-activity')
export class UserActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  name?: string;
}
