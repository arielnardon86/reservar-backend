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
    origin: (origin, callback) => {
      // Permitir requests sin origin (mobile apps, Postman, etc.)
      if (!origin) {
        console.log('⚠️  Request without origin, allowing...');
        return callback(null, true);
      }
      
      console.log('🔍 CORS check for origin:', origin);
      
      // Verificar si el origin está permitido
      if (allowedOrigins.includes(origin)) {
        console.log('✅ Origin allowed:', origin);
        callback(null, true);
      } else {
        // En desarrollo, permitir cualquier origin
        if (process.env.NODE_ENV !== 'production') {
          console.log('⚠️  Development mode: allowing origin:', origin);
          callback(null, true);
        } else {
          console.error('❌ CORS blocked origin:', origin);
          console.error('   Allowed origins:', allowedOrigins);
          callback(new Error(`Not allowed by CORS. Origin: ${origin} not in allowed list: ${allowedOrigins.join(', ')}`));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
}

bootstrap();

