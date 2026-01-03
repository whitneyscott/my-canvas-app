import { Module } from '@nestjs/common';
import { AutomatedTestController } from './automated-test.controller';
import { AutomatedTestService } from './automated-test.service';

@Module({
  controllers: [AutomatedTestController],
  providers: [AutomatedTestService],
})
export class AutomatedTestModule {}






