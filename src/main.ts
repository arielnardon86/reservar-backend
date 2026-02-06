import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  // Permitir múltiples orígenes (desarrollo y producción)
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000'];
  
  console.log('🌐 CORS Configuration:');
  console.log('  - NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('  - ALLOWED_ORIGINS:', allowedOrigins);
  
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Cambiar a false para permitir campos adicionales y evitar 404
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  const port = process.env.PORT || 3001;
  // Escuchar en 0.0.0.0 para que Railway pueda conectarse
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend running on http://0.0.0.0:${port}`);
  console.log(`🌐 Accessible from Railway on port ${port}`);
  console.log(`📋 POST /tenants endpoint should be available`);
}

bootstrap();

