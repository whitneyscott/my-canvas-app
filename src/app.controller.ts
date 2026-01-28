// Re-export the controller implementation from src/app/app.controller.ts
export { AppController } from './app/app.controller';
// This file intentionally forwards the named export so existing imports
// that reference './app.controller' continue to work while the
// canonical implementation lives under src/app/app.controller.ts
// (avoids duplicate-class issues and keeps runtime mappings consistent).
