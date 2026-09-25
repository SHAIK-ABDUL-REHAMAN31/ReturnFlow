import { cacheService } from '../lib/cache.service.js';
import { AppError } from '../lib/app-error.js';

export function rateLimit(options) {
  const { windowSeconds, maxRequests, prefix = 'rl' } = options;

  return async (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const identifier = req.user?.id || ip.toString();
    const cacheKey = `ratelimit:${prefix}:${identifier}`;

    try {
      const currentCount = await cacheService.incrementRateCounter(cacheKey, windowSeconds);

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - currentCount));

      if (currentCount > maxRequests) {
        res.setHeader('Retry-After', windowSeconds);
        return next(
          new AppError(
            429,
            'RATE_LIMIT_EXCEEDED',
            `Too many requests. Please retry after ${windowSeconds} seconds.`
          )
        );
      }

      next();
    } catch {
      next();
    }
  };
}
