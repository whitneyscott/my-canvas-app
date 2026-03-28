import {
  qaAccessibilityHeadersAllowed,
} from './qa-accessibility-env';

describe('qaAccessibilityHeadersAllowed', () => {
  it('returns false in production even when QA_ACCESSIBILITY_ENABLED=1', () => {
    expect(
      qaAccessibilityHeadersAllowed({
        NODE_ENV: 'production',
        QA_ACCESSIBILITY_ENABLED: '1',
      }),
    ).toBe(false);
  });

  it('returns true when QA_ACCESSIBILITY_ENABLED=1 and not production', () => {
    expect(
      qaAccessibilityHeadersAllowed({
        NODE_ENV: 'development',
        QA_ACCESSIBILITY_ENABLED: '1',
      }),
    ).toBe(true);
  });

  it('returns false when QA_ACCESSIBILITY_ENABLED is unset', () => {
    expect(
      qaAccessibilityHeadersAllowed({
        NODE_ENV: 'development',
      }),
    ).toBe(false);
  });
});
