import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { CanvasController } from './canvas/canvas.controller';
import { CanvasService } from './canvas/canvas.service';
import { AutomatedTestModule } from './automated-test/automated-test.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true
    }),
    AuthModule,
    AutomatedTestModule,
  ],
  controllers: [AppController, CanvasController],
  providers: [CanvasService],
})
export class AppModule {}
