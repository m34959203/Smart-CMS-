import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

// Function to normalize URL (add https:// if missing)
function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!normalized) return '';

  // If it's a Railway internal domain, skip it (not for CORS)
  if (normalized.includes('.railway.internal')) {
    logger.warn(`Skipping internal domain for CORS: ${normalized}`);
    return '';
  }

  // If URL doesn't start with http, add https://
  if (!normalized.startsWith('http')) {
    normalized = `https://${normalized}`;
  }

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');

  return normalized;
}

// Function to get allowed CORS origins from environment
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  // 1. Primary: CORS_ORIGIN (supports comma-separated values)
  const corsOrigin = process.env.CORS_ORIGIN || '';
  if (corsOrigin) {
    corsOrigin.split(',').forEach(url => {
      const normalized = normalizeUrl(url);
      if (normalized) origins.push(normalized);
    });
  }

  // 2. Fallback: FRONTEND_URL
  const frontendUrl = process.env.FRONTEND_URL || '';
  if (frontendUrl) {
    const normalized = normalizeUrl(frontendUrl);
    if (normalized) origins.push(normalized);
  }

  // 3. Railway auto-detection: RAILWAY_PUBLIC_DOMAIN for the web service
  // This is useful when deploying on Railway - set RAILWAY_PUBLIC_DOMAIN in api service
  // to the public domain of the web service
  const railwayPublicDomain = process.env.RAILWAY_PUBLIC_DOMAIN || '';
  if (railwayPublicDomain) {
    const normalized = normalizeUrl(railwayPublicDomain);
    if (normalized) origins.push(normalized);
  }

  // 4. Additional known origins from CORS_KNOWN_ORIGINS env var
  const knownOriginsEnv = process.env.CORS_KNOWN_ORIGINS || '';
  if (knownOriginsEnv) {
    knownOriginsEnv.split(',').forEach(url => {
      const normalized = normalizeUrl(url);
      if (normalized) origins.push(normalized);
    });
  }

  // 5. Default localhost origins for development
  const defaultDevOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  // Add default dev origins if no production origins configured or in development mode
  if (origins.length === 0 || process.env.NODE_ENV !== 'production') {
    origins.push(...defaultDevOrigins);
  }

  // Remove duplicates
  const uniqueOrigins = [...new Set(origins)];

  // Log environment variable sources for debugging
  logger.log(`CORS config sources: CORS_ORIGIN="${corsOrigin}", FRONTEND_URL="${frontendUrl}", RAILWAY_PUBLIC_DOMAIN="${railwayPublicDomain}"`);

  return uniqueOrigins;
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
