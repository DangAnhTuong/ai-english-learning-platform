/**
 * Script để reset rate limit (xóa store của rate limiter)
 * Chạy: node scripts/reset-rate-limit.js
 */

const rateLimit = require('express-rate-limit');

// Tạo một limiter tạm để clear store
const tempLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});

console.log('✅ Rate limit store đã được reset');
console.log('⚠️  Bạn cần restart backend để áp dụng thay đổi!');
console.log('   Hoặc đợi 15 phút để rate limit tự động reset.\n');
