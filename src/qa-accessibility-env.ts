export function qaAccessibilityHeadersAllowed(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.NODE_ENV === 'production') {
    return false;
  }
  return env.QA_ACCESSIBILITY_ENABLED === '1';
}
