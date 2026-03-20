import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CanvasController } from './canvas.controller';
import { CanvasService } from './canvas.service';

describe('CanvasController', () => {
  let controller: CanvasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [CanvasController],
      providers: [CanvasService, { provide: 'REQUEST', useValue: {} }],
    }).compile();

    controller = await module.resolve<CanvasController>(CanvasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
