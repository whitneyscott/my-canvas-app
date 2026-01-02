import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // This tells Nest where to find your HTML files
  // When running from dist/src, go up two levels to reach root
  app.setBaseViewsDir(join(__dirname, '..', '..', 'views'));
  app.setViewEngine('ejs');

  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, '..', '..', 'public'));

  await app.listen(3000);
}
bootstrap();