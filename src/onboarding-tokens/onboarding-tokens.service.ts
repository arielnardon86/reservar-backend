import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class OnboardingTokensService {
  constructor(private prisma: PrismaService) {}

  /** Genera un token aleatorio seguro */
  private generateToken(): string {
    return crypto.randomBytes(24).toString('base64url');
  }

  /**
   * Crea un nuevo token de un solo uso.
   * Requiere adminSecret para autorizar.
   */
  async create(adminSecret: string) {
    const expectedSecret = process.env.ONBOARDING_ADMIN_SECRET;
    if (!expectedSecret) {
      throw new BadRequestException('Sistema no configurado para generar links');
    }
    if (adminSecret !== expectedSecret) {
      throw new UnauthorizedException('Clave incorrecta');
    }

    const token = this.generateToken();
    await this.prisma.onboardingToken.create({
      data: { token },
    });
    return { token };
  }

  /**
   * Valida si un token existe y no ha sido usado.
   */
  async validate(token: string): Promise<{ valid: boolean }> {
    if (!token || typeof token !== 'string') {
      return { valid: false };
    }
    const record = await this.prisma.onboardingToken.findUnique({
      where: { token: token.trim() },
    });
    const valid = !!record && !record.usedAt;
    return { valid };
  }

  /**
   * Marca un token como usado (llamado cuando se completa el onboarding).
   */
  async markAsUsed(token: string, tenantId: string) {
    await this.prisma.onboardingToken.updateMany({
      where: { token: token.trim(), usedAt: null },
      data: { usedAt: new Date(), tenantId },
    });
  }
}
