import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/** Límite de conexiones para no superar el máximo del plan DB (ej. Clever Cloud). */
// Clever Cloud free tier tiene límite de 2-3 conexiones, usar 2 para estar seguro
const CONNECTION_LIMIT = parseInt(process.env.DATABASE_CONNECTION_LIMIT || '2', 10) || 2;

function databaseUrlWithLimit(): string {
  const url = process.env.DATABASE_URL || '';
  if (!url) return url;
  // No modificar la URL si ya tiene connection_limit o pool_timeout (evita tocar contraseñas con caracteres raros)
  if (/[?&](connection_limit|pool_timeout)=/.test(url)) return url;
  const sep = url.includes('?') ? '&' : '?';
  // Configurar pool pequeño para Clever Cloud: connection_limit=2 y pool_timeout=10s
  return `${url}${sep}connection_limit=${CONNECTION_LIMIT}&pool_timeout=10`;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private static instance: PrismaService;

  constructor() {
    super({
      datasources: {
        db: { url: databaseUrlWithLimit() },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
    
    // Singleton pattern para evitar múltiples instancias
    if (!PrismaService.instance) {
      PrismaService.instance = this;
    }
    return PrismaService.instance;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Prisma Client connected to database');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      console.log('✅ Prisma Client disconnected from database');
    } catch (error) {
      console.error('❌ Error disconnecting from database:', error);
    }
  }
}


