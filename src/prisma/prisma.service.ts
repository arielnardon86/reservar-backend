import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/** Límite de conexiones para no superar el máximo del plan DB (ej. Clever Cloud). */
const CONNECTION_LIMIT = parseInt(process.env.DATABASE_CONNECTION_LIMIT || '5', 10) || 5;

function databaseUrlWithLimit(): string {
  const url = process.env.DATABASE_URL || '';
  if (!url) return url;
  // No modificar la URL si ya tiene connection_limit (evita tocar contraseñas con caracteres raros)
  if (/[?&]connection_limit=/.test(url)) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}connection_limit=${CONNECTION_LIMIT}`;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: { url: databaseUrlWithLimit() },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}


