"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
// Re-export the controller implementation from src/app/app.controller.ts
var app_controller_1 = require("./app/app.controller");
Object.defineProperty(exports, "AppController", { enumerable: true, get: function () { return app_controller_1.AppController; } });
// This file intentionally forwards the named export so existing imports
// that reference './app.controller' continue to work while the
// canonical implementation lives under src/app/app.controller.ts
// (avoids duplicate-class issues and keeps runtime mappings consistent).
