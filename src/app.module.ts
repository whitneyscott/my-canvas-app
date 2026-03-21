import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app/app.controller';
import { CanvasController } from './canvas/canvas.controller';
import { CanvasService } from './canvas/canvas.service';
import { CollegeScorecardController } from './college-scorecard/college-scorecard.controller';
import { CollegeScorecardService } from './college-scorecard/college-scorecard.service';
import { AutomatedTestModule } from './automated-test/automated-test.module';
import { LtiModule } from './lti/lti.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true
    }),
    AutomatedTestModule,
    LtiModule,
  ],
  controllers: [AppController, CanvasController, CollegeScorecardController],
  providers: [CanvasService, CollegeScorecardService],
})
export class AppModule {}
