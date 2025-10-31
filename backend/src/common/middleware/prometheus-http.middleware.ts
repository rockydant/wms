import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../services/metrics.service';

/**
 * Prometheus HTTP metrics middleware
 * Tracks HTTP request metrics using prom-client
 */
@Injectable()
export class PrometheusHttpMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const metricsService = this.metricsService;

    // Capture original end function
    const originalEnd = res.end.bind(res);

    res.end = function (chunk?: any, encoding?: any, cb?: any): any {
      const duration = Date.now() - startTime;
      const route = req.route?.path || req.path || req.url;
      const method = req.method;

      // Record metrics
      if (res.statusCode) {
        metricsService.recordHttpRequest(method, route, res.statusCode, duration);
      }

      // Call original end function
      return originalEnd(chunk, encoding, cb);
    };

    next();
  }
}
