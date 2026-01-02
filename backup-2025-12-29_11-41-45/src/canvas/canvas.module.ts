import { Module } from '@nestjs/common';
import { CanvasService } from './canvas.service';
import { CanvasController } from './canvas.controller';

@Module({
  providers: [CanvasService],
  controllers: [CanvasController]
})
export class CanvasModule {}
