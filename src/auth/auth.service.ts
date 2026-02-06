import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LoginDto } from './dto/login.dto';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /** Login con email y contraseña (administradores) */
  async loginWithPassword(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { tenant: true },
    });
    if (!user) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }
    if (!user.passwordHash) {
      throw new UnauthorizedException('Este usuario no tiene contraseña configurada. Contactá al administrador.');
    }
    const valid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        tenant: user.tenant ? {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
        } : null,
      },
    };
  }

  async sendMagicLink(loginDto: { email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generar token temporal
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutos

    // Guardar token en base de datos
    await this.prisma.magicLinkToken.create({
      data: {
        email: loginDto.email,
        token,
        expiresAt,
      },
    });

    // Enviar email con magic link
    try {
      await this.notificationsService.sendMagicLink(loginDto.email, token);
    } catch (error) {
      console.error('Error sending magic link email:', error);
      // No fallar si el email falla, pero loguear el error
    }

    const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`;

    return {
      message: 'Magic link sent to email',
      // En desarrollo, retornamos el link (NO hacer esto en producción)
      magicLink: process.env.NODE_ENV === 'development' ? magicLink : undefined,
    };
  }

  async verifyMagicLink(token: string) {
    const magicLinkToken = await this.prisma.magicLinkToken.findUnique({
      where: { token },
    });

    if (!magicLinkToken) {
      throw new NotFoundException('Invalid token');
    }

    if (magicLinkToken.used) {
      throw new Error('Token already used');
    }

    if (magicLinkToken.expiresAt < new Date()) {
      throw new Error('Token expired');
    }

    // Obtener usuario
    const user = await this.prisma.user.findUnique({
      where: { email: magicLinkToken.email },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Marcar token como usado
    await this.prisma.magicLinkToken.update({
      where: { id: magicLinkToken.id },
      data: { used: true },
    });

    // Actualizar último login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // TODO: Generar JWT token
    // Por ahora retornamos user data
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        tenant: user.tenant,
      },
      // jwt: '...' // En producción, generar JWT
    };
  }
}

