import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const tenantId = request['tenantId'];
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[TenantGuard] Checking tenantId:', tenantId);
      console.log('[TenantGuard] Request path:', request.path);
    }
    
    if (!tenantId) {
      console.error('[TenantGuard] Tenant ID is missing!');
      throw new BadRequestException('Tenant ID is required. Please provide x-tenant-id header.');
    }
    
    return true;
  }
}

