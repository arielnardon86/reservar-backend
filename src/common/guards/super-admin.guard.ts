import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Injectable()
export class SuperAdminGuard extends JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Primero validar el JWT token
    const isValid = await super.canActivate(context);
    if (!isValid) {
      return false;
    }

    const request = context.switchToHttp().getRequest<Request>();
    
    // El usuario ya está validado por JwtAuthGuard y está en request.user
    const user = request.user as any;
    
    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    
    // Verificar que el usuario es super admin
    if (!user.isSuperAdmin) {
      throw new UnauthorizedException('No tienes permisos de super administrador.');
    }
    
    // Agregar el usuario al request para uso posterior
    request['superAdmin'] = user;
    
    return true;
  }
}
