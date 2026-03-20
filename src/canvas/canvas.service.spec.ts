import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CanvasService } from './canvas.service';

describe('CanvasService', () => {
  let service: CanvasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [CanvasService, { provide: 'REQUEST', useValue: {} }],
    }).compile();

    service = await module.resolve<CanvasService>(CanvasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
