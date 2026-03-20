import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app/app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should return status ok for test-path', () => {
    expect(appController.testPath()).toEqual({ status: 'ok' });
  });
});
