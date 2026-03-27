import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LtiController } from './lti.controller';
import { OAuthController } from './oauth.controller';
import { JwksService } from './jwks.service';
import { LaunchVerifyService } from './launch.verify.service';
import { Lti11LaunchVerifyService } from './lti11-launch.verify.service';
import { PlatformService } from './platform.service';

@Module({
  imports: [ConfigModule],
  controllers: [LtiController, OAuthController],
  providers: [
    JwksService,
    LaunchVerifyService,
    Lti11LaunchVerifyService,
    PlatformService,
  ],
  exports: [],
})
export class LtiModule {}
