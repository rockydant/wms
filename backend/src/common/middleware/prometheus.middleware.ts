import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Prometheus metrics middleware
 * Tracks HTTP request metrics
 */
@Injectable()
export class PrometheusMiddleware implements NestMiddleware {
  // In a real implementation, you would use prom-client
  // This is a placeholder structure
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      // Track metrics: request duration, status codes, endpoint paths
      // Example: http_request_duration_seconds{method, endpoint, status}
      console.log(`[Metrics] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });

    next();
  }
}

/**
 * Export prometheus middleware function
 */
export const prometheusMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const middleware = new PrometheusMiddleware();
  return middleware.use(req, res, next);
};
