"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qaAccessibilityHeadersAllowed = qaAccessibilityHeadersAllowed;
function qaAccessibilityHeadersAllowed(env) {
  if (env === void 0) {
    env = process.env;
  }
  if (env.NODE_ENV === 'production') {
    return false;
  }
  return env.QA_ACCESSIBILITY_ENABLED === '1';
}
