import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HocasController } from './hocas.controller';
import { HocasService } from './hocas.service';
import { HocaEntity } from './entities/hoca.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HocaEntity])],
  controllers: [HocasController],
  providers: [HocasService],
  exports: [HocasService],
})
export class HocasModule {}
