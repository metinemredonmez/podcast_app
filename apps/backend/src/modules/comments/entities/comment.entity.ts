import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('comment')
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  name?: string;
}
