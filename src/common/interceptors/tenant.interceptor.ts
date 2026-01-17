import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const tenantId = request['tenantId'];
    
    // El tenantId ya está disponible en el request
    // Los servicios pueden acceder a él mediante @TenantId() decorator
    
    return next.handle();
  }
}


