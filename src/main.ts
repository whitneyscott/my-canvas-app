import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. ADDED: Increase limits for HUGE Canvas payloads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Keep your global prefix
  app.setGlobalPrefix('bulk-canvas-editor');

  // Keep your views and static assets config
  app.setBaseViewsDir(join(process.cwd(), 'views'));
  app.setViewEngine('ejs');
  app.useStaticAssets(join(process.cwd(), 'public'));

  // Keep CORS
  app.enableCors();

  // 2. MODIFIED: Start the server (Render requires this)
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}

// 3. MODIFIED: Execute the bootstrap function
bootstrap();