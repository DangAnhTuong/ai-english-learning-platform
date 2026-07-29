// Mock Redis client for local development without Docker
const inMemoryStore = new Map();

const redisClient = {
    setEx: async (key, seconds, value) => {
        inMemoryStore.set(key, value);
        // Automatically delete after expiration
        setTimeout(() => {
            inMemoryStore.delete(key);
        }, seconds * 1000);
        return 'OK';
    },
    get: async (key) => {
        return inMemoryStore.get(key) || null;
    },
    del: async (key) => {
        inMemoryStore.delete(key);
        return 1;
    },
    on: () => {},
    connect: async () => {
        console.log('✅ Mock In-Memory Redis connected successfully (No Docker needed)');
    }
};

module.exports = redisClient;
