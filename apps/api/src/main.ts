import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

// Function to get allowed CORS origins from environment
function getAllowedOrigins(): string[] {
  const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '';

  // Support multiple origins separated by commas
  const origins = corsOrigin.split(',').map(url => {
    let trimmedUrl = url.trim();

    // If it's just a service name (no dots), add .onrender.com
    if (trimmedUrl && !trimmedUrl.includes('.') && !trimmedUrl.startsWith('http') && !trimmedUrl.includes('localhost')) {
      trimmedUrl = `${trimmedUrl}.onrender.com`;
    }

    // If URL doesn't start with http, add https://
    if (trimmedUrl && !trimmedUrl.startsWith('http')) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    return trimmedUrl;
  }).filter(url => url);

  // Default localhost origins for development
  const defaultDevOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  // Additional known origins can be set via CORS_KNOWN_ORIGINS env var
  const knownOriginsEnv = process.env.CORS_KNOWN_ORIGINS || '';
  const additionalKnownOrigins = knownOriginsEnv
    .split(',')
    .map(url => url.trim())
    .filter(url => url);

  // Combine: env origins + known origins + dev origins (if in development)
  const allOrigins = [...origins, ...additionalKnownOrigins];

  // Add default dev origins if no production origins configured or in development mode
  if (allOrigins.length === 0 || process.env.NODE_ENV !== 'production') {
    allOrigins.push(...defaultDevOrigins);
  }

  // Remove duplicates
  return [...new Set(allOrigins)];
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Enable rawBody for webhook signature verification
    rawBody: true,
  });

  // Increase body parser limit for large articles
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Serve uploaded files statically at both paths for backward compatibility
  const uploadsPath = join(process.cwd(), 'uploads');

  // New path with /api prefix (for new uploads)
  app.useStaticAssets(uploadsPath, {
    prefix: '/api/uploads/',
  });

  // Legacy path without /api prefix (for existing images)
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  logger.log(`Serving static files from: ${uploadsPath} at /api/uploads/ and /uploads/`);

  const allowedOrigins = getAllowedOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      // Разрешаем запросы без origin (например, мобильные приложения, Postman)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  logger.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Aimak Akshamy API')
    .setDescription('API for city newspaper')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  // Explicitly bind to 0.0.0.0 for container/cloud deployments (Fly.io, Railway, Render)
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: http://0.0.0.0:${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`Swagger docs available at: http://localhost:${port}/api/docs`);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, starting graceful shutdown...`);
    try {
      await app.close();
      logger.log('Application closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.error('Failed to start application', error);
  process.exit(1);
});
