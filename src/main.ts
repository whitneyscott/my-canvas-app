import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // This tells Nest where to find your HTML files
  // Use process.cwd() to get the project root, which works in both dev and production
  app.setBaseViewsDir(join(process.cwd(), 'views'));
  app.setViewEngine('ejs');

  // Serve static files from the public directory
  app.useStaticAssets(join(process.cwd(), 'public'));

  // Enable CORS if needed
  app.enableCors();

  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();