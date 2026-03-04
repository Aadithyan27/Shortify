import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
        if (times > 3) {
            console.warn('Redis connection failed, giving up.');
            return null;
        }
        return Math.min(times * 50, 2000);
    }
});

redis.on('error', (err) => {
    console.warn('Redis error (gracefully degrading):', err.message);
});
