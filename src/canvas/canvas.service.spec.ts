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

  it('tier1 flags img missing alt', () => {
    const base = {
      resource_type: 'pages',
      resource_id: 'x',
      resource_title: 't',
      resource_url: null as string | null,
    };
    const raw = (service as any).evaluateAccessibilityTier1ForHtml;
    const out = raw.call(service, base, '<img src="x">') as Array<{
      rule_id: string;
    }>;
    expect(out.some((f) => f.rule_id === 'img_missing_alt')).toBe(true);
  });

  it('tier1 flags text-align justify', () => {
    const base = {
      resource_type: 'pages',
      resource_id: 'x',
      resource_title: 't',
      resource_url: null as string | null,
    };
    const html = '<p style="text-align: justify;">x</p>';
    const raw = (service as any).evaluateAccessibilityTier1ForHtml;
    const out = raw.call(service, base, html) as Array<{ rule_id: string }>;
    expect(out.some((f) => f.rule_id === 'text_justified')).toBe(true);
  });

  it('tier1 flags font-size below 10px', () => {
    const base = {
      resource_type: 'pages',
      resource_id: 'x',
      resource_title: 't',
      resource_url: null as string | null,
    };
    const html = '<p style="font-size:8px;">x</p>';
    const raw = (service as any).evaluateAccessibilityTier1ForHtml;
    const out = raw.call(service, base, html) as Array<{ rule_id: string }>;
    expect(out.some((f) => f.rule_id === 'font_size_too_small')).toBe(true);
  });
});
