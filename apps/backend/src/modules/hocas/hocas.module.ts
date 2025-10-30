import { Module } from '@nestjs/common';
import { HocasController } from './hocas.controller';
import { HocasService } from './hocas.service';

@Module({
  imports: [],
  controllers: [HocasController],
  providers: [HocasService],
  exports: [HocasService],
})
export class HocasModule {}
