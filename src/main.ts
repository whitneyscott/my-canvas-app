import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import session from 'express-session';
import * as express from 'express';

// IMPORTANT: Folder deletion is intentionally disabled in this tool.
// Canvas requires recursive deletion of folder contents before the folder
// itself can be removed. A bug in recursive deletion could cause
// catastrophic, unrecoverable loss of course content.
// Folder deletion must be performed manually in Canvas.
// Do not implement folder delete without explicit written approval.

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Essential for Render's HTTPS proxy
  app.set('trust proxy', 1);

  // Preserve raw request body for signature verification (LTI)
  // Capture urlencoded and json raw body into `req.rawBody`
  app.use(express.urlencoded({ extended: false, verify: (req: any, _res, buf: Buffer) => { req.rawBody = buf.toString(); } }));
  app.use(express.json({ verify: (req: any, _res, buf: Buffer) => { if (buf && buf.length) req.rawBody = buf.toString(); } }));

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-secret',
      resave: false,
      saveUninitialized: false,
      proxy: true, // Tells the session to trust the Render proxy
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 3600000, // 1 hour session
      },
    }),
  );

  app.use((req: any, _res, next) => {
    const qaToken = req.headers['x-qa-canvas-token'];
    const qaUrl = req.headers['x-qa-canvas-url'];
    if (
      process.env.QA_ACCESSIBILITY_ENABLED === '1' &&
      qaToken &&
      qaUrl &&
      String(req.path || '').startsWith('/canvas/')
    ) {
      if (!req.session) req.session = {};
      req.session.canvasToken = qaToken;
      req.session.canvasUrl = String(qaUrl).replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '') + '/api/v1';
    }
    next();
  });

  // Path resolution for both local and deployed environments
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setViewEngine('ejs');

  app.enableCors();

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`Application is running on port: ${port}`);
}
bootstrap();