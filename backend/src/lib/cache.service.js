import Redis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from './logger.js';

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;

    try {
      this.client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 2,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn({ attempt: times }, 'Redis connection retry limit reached, running in degraded mode');
            return null;
          }
          return Math.min(times * 100, 1000);
        },
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Connected to Redis cache');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        logger.warn({ error: err.message }, 'Redis error - operations will fall back');
      });

      this.client.connect().catch((err) => {
        logger.warn({ error: err.message }, 'Could not initially connect to Redis');
      });
    } catch (err) {
      logger.warn({ error: err }, 'Redis initialization failed');
    }
  }

  async get(key) {
    if (!this.client || !this.isConnected) return null;
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (err) {
      logger.warn({ key, error: err }, 'Cache GET failed, falling back');
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    if (!this.client || !this.isConnected) return;
    try {
      const serialized = JSON.stringify(value);
      await this.client.set(key, serialized, 'EX', ttlSeconds);
    } catch (err) {
      logger.warn({ key, error: err }, 'Cache SET failed');
    }
  }

  async del(key) {
    if (!this.client || !this.isConnected) return;
    try {
      await this.client.del(key);
    } catch (err) {
      logger.warn({ key, error: err }, 'Cache DEL failed');
    }
  }

  /**
   * Atomic abuse counter using Redis MULTI (INCR + EXPIRE).
   * Prevents race condition bugs where concurrent requests bypass limits.
   */
  async incrementRateCounter(key, windowSeconds = 60) {
    if (!this.client || !this.isConnected) return 1;
    try {
      const pipeline = this.client.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, windowSeconds);
      const results = await pipeline.exec();
      const count = results?.[0]?.[1] || 1;
      return count;
    } catch (err) {
      logger.warn({ key, error: err }, 'Rate counter increment failed');
      return 1;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }
}

export const cacheService = new CacheService();
