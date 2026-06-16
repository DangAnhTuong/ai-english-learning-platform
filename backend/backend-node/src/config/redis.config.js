const redis = require('redis');

const redisUri = process.env.REDIS_URI || 'redis://localhost:6379';

const redisClient = redis.createClient({
    url: redisUri
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis connected successfully'));

// Connect immediately
(async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('Failed to connect to Redis on startup:', error);
    }
})();

module.exports = redisClient;
