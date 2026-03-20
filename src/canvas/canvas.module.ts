import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CanvasController } from './canvas.controller';
import { CanvasService } from './canvas.service';

@Module({
  imports: [ConfigModule],
  controllers: [CanvasController],
  providers: [CanvasService],
  exports: [CanvasService],
})
export class CanvasModule {}
