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
      'heading_empty',
      'img_missing_alt',
      'img_alt_too_long',
      'img_alt_filename',
      'img_decorative_misuse',
      'img_meaningful_empty_alt',
      'img_text_in_image_warning',
      'link_ambiguous_text',
      'link_split_or_broken',
      'link_file_missing_type_size_hint',
      'heading_too_long',
      'heading_skipped_level',
      'heading_visual_only_style',
      'table_missing_caption',
      'iframe_missing_title',
      'button_empty_name',
      'form_control_missing_label',
      'aria_hidden_focusable',
      'lang_inline_missing',
      'color_only_information',
      'sensory_only_instructions',
      'landmark_structure_quality',
      'link_empty_name',
      'list_not_semantic',
      'table_missing_header',
      'aria_invalid_role',
      'lang_invalid',
    ]);
    const expectedImg = sort([
      'img_missing_alt',
      'img_alt_filename',
      'img_decorative_misuse',
      'img_meaningful_empty_alt',
      'img_text_in_image_warning',
    ]);
    expect(sort([...ACCESSIBILITY_AI_SUGGESTED_RULES])).toEqual(expectedAi);
    expect(sort([...ACCESSIBILITY_IMAGE_RULES])).toEqual(expectedImg);
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
});
