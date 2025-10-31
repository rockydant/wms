import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to extract tenant context from request headers or subdomain
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant from subdomain (e.g., tenant1.fulfillflow.com)
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];

    // Or extract from header
    const tenantId = req.headers['x-tenant-id'] as string;

    // Attach tenant context to request
    (req as any).tenantSubdomain = subdomain;
    (req as any).tenantId = tenantId;

    next();
  }
}
