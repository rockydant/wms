import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract tenant ID from request
 * Used in controllers to get current tenant context
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.tenantId || request.headers['x-tenant-id'];
  },
);
