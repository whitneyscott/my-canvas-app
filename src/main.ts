import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import session from 'express-session';
import * as express from 'express';

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

  // Path resolution for both local and deployed environments
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setViewEngine('ejs');

  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on port: ${port}`);
}
bootstrap();