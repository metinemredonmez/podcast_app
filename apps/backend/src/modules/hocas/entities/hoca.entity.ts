import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('hoca')
export class HocaEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  name?: string;
}
