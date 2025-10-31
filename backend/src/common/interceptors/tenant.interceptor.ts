import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Interceptor to automatically add tenantId to response data
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId || request.headers['x-tenant-id'];

    return next.handle().pipe(
      map((data) => {
        // Automatically add tenantId to response if not present
        if (data && typeof data === 'object' && !data.tenantId && tenantId) {
          return { ...data, tenantId };
        }
        return data;
      }),
    );
  }
}
