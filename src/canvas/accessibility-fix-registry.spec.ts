import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  ACCESSIBILITY_FIXABILITY_MAP,
  ACCESSIBILITY_AI_SUGGESTED_RULES,
  ACCESSIBILITY_IMAGE_RULES,
  CanvasService,
} from './canvas.service';

const sort = (a: string[]) => [...a].sort();

describe('accessibility fixability registry', () => {
  it('derives uses_ai and is_image_rule sets from the map', () => {
    const expectedAi = sort([
      'button_empty_name',
      'color_only_information',
      'form_control_missing_label',
      'heading_visual_only_style',
      'img_alt_filename',
      'img_alt_too_long',
      'img_decorative_misuse',
      'img_meaningful_empty_alt',
      'img_missing_alt',
      'img_text_in_image_warning',
      'landmark_structure_quality',
      'link_ambiguous_text',
      'link_empty_name',
      'link_split_or_broken',
      'sensory_only_instructions',
    ]);
    const expectedImg = sort([
      'img_missing_alt',
      'img_alt_too_long',
      'img_alt_filename',
      'img_decorative_misuse',
      'img_meaningful_empty_alt',
      'img_text_in_image_warning',
    ]);
    expect(
      sort(
        Array.from<string>(
          ACCESSIBILITY_AI_SUGGESTED_RULES as Iterable<string>,
        ),
      ),
    ).toEqual(expectedAi);
    expect(
      sort(Array.from<string>(ACCESSIBILITY_IMAGE_RULES as Iterable<string>)),
    ).toEqual(expectedImg);
  });

  it('maps every rule_id to uses_ai consistent with the map', () => {
    for (const [id, c] of Object.entries(ACCESSIBILITY_FIXABILITY_MAP)) {
      expect(ACCESSIBILITY_AI_SUGGESTED_RULES.has(id)).toBe(c.uses_ai);
      expect(ACCESSIBILITY_IMAGE_RULES.has(id)).toBe(c.is_image_rule);
    }
  });
});

type RunFixExecutor = (
  html: string,
  fixType: string,
) => { newHtml: string; changes: unknown[] } | null;

describe('runFixExecutor accessibility probes', () => {
  let service: CanvasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [CanvasService, { provide: 'REQUEST', useValue: {} }],
    }).compile();
    service = await module.resolve<CanvasService>(CanvasService);
  });

  it('returns a change for link_broken_teacher_href when an anchor exists', () => {
    const { runFixExecutor } = service as unknown as {
      runFixExecutor: RunFixExecutor;
    };
    const html = '<p><a href="http://broken.invalid/x">text</a></p>';
    const r = runFixExecutor.call(
      service,
      html,
      'link_broken_teacher_href',
    ) as ReturnType<RunFixExecutor> | null;
    expect(r).not.toBeNull();
    if (!r) return;
    expect(r.changes.length).toBeGreaterThan(0);
  });

  it('iframe_title_from_src uses SproutVideo label for sproutvideo.com hosts', () => {
    const { runFixExecutor } = service as unknown as {
      runFixExecutor: RunFixExecutor;
    };
    const html =
      '<iframe src="https://videos.sproutvideo.com/embed/a/b"></iframe>';
    const r = runFixExecutor.call(
      service,
      html,
      'iframe_title_from_src',
    ) as { newHtml: string; changes: unknown[] } | null;
    expect(r).not.toBeNull();
    if (!r) return;
    expect(r.newHtml).toContain('SproutVideo embedded content');
  });
});
