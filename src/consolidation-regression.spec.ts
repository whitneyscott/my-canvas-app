import { TEST_CONFIG } from './config/test-registry.config';

describe('consolidation regression guardrails', () => {
  it('uses discussion_topics for discussions and announcements paths', () => {
    const courseId = 42;
    expect(TEST_CONFIG.discussions.updatePath(courseId, 7)).toContain(
      '/discussion_topics/',
    );
    expect(TEST_CONFIG.announcements.updatePath(courseId, 7)).toContain(
      '/discussion_topics/',
    );
  });

  it('keeps announcements params aligned with announcement grid date fields', () => {
    const params = TEST_CONFIG.announcements.params;
    expect(params).toEqual(
      expect.arrayContaining([
        'title',
        'message',
        'allow_rating',
        'delayed_post_at',
        'lock_at',
        'published',
      ]),
    );
    expect(params).not.toContain('unlock_at');
  });

  it('keeps modules params aligned with runtime module fields', () => {
    const params = TEST_CONFIG.modules.params;
    expect(params).toEqual(
      expect.arrayContaining(['name', 'position', 'unlock_at', 'published']),
    );
    expect(params).not.toContain('require_sequential_progress');
  });
});
