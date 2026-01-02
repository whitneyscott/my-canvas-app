import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Add this
import { AppController } from './app.controller';
import { CanvasController } from './canvas/canvas.controller';
import { CanvasService } from './canvas/canvas.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Add this line
  ],
  controllers: [AppController, CanvasController],
  providers: [CanvasService],
})
export class AppModule {}
