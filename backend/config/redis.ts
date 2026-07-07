import { createClient } from 'redis';

let redisClient: any = null;
let isRedisConnected = false;

// Simple in-memory fallback cache in case Redis is not installed/running
class MemoryCache {
  private cache = new Map<string, { value: string; expiry: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, expirySeconds: number): Promise<void> {
    const expiry = Date.now() + expirySeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

const memoryCache = new MemoryCache();

const connectRedis = async () => {
  if (process.env.REDIS_URL) {
    try {
      redisClient = createClient({ url: process.env.REDIS_URL });
      
      redisClient.on('error', (err: any) => {
        console.warn('Redis Client connection error. Using in-memory fallback cache.', err.message);
        isRedisConnected = false;
      });

      await redisClient.connect();
      console.log('Connected to Redis server successfully.');
      isRedisConnected = true;
    } catch (err: any) {
      console.warn('Redis connection failed. Using in-memory fallback cache.');
      isRedisConnected = false;
    }
  } else {
    console.log('REDIS_URL is not set in env. Using in-memory fallback cache.');
  }
};

connectRedis();

export const cache = {
  async get(key: string): Promise<string | null> {
    if (isRedisConnected && redisClient) {
      try {
        return await redisClient.get(key);
      } catch (err) {
        return await memoryCache.get(key);
      }
    }
    return await memoryCache.get(key);
  },

  async set(key: string, value: string, expirySeconds: number = 3600): Promise<void> {
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.set(key, value, { EX: expirySeconds });
        return;
      } catch (err) {
        await memoryCache.set(key, value, expirySeconds);
        return;
      }
    }
    await memoryCache.set(key, value, expirySeconds);
  },

  async del(key: string): Promise<void> {
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.del(key);
        return;
      } catch (err) {
        await memoryCache.del(key);
        return;
      }
    }
    await memoryCache.del(key);
  }
};
