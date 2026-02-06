import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Log todas las requests para debugging
    console.log(`[TenantMiddleware] ${req.method} ${req.path}`);
    
    // Extraer tenant_id de diferentes fuentes:
    // 1. Header X-Tenant-Id (para admin) - Express normaliza headers a lowercase
    // 2. Subdomain (futuro: tenant1.turnero.com)
    // 3. Path parameter (futuro: /api/tenants/:slug/...)
    // 4. Query parameter (temporal para desarrollo)
    
    const tenantId = 
      (req.headers['x-tenant-id'] as string) ||
      (req.headers['X-Tenant-Id'] as string) ||
      (req.query.tenantId as string) ||
      undefined;
    
    // Debug logging
    console.log('[TenantMiddleware] Request details:', {
      method: req.method,
      path: req.path,
      'x-tenant-id': req.headers['x-tenant-id'],
      extractedTenantId: tenantId,
    });
    
    req['tenantId'] = tenantId;
    next(); // IMPORTANTE: siempre llamar next() para continuar
  }
}

