const rateLimit = require('express-rate-limit');

const createAccountLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 5 accounts per hour per IP
    message: {
        error: 'Quá nhiều tài khoản được tạo từ IP này. Vui lòng thử lại sau 1 giờ.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Tăng lên 100 để test (sẽ giảm lại sau)
    message: {
        error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limit trong development mode
        if (process.env.NODE_ENV !== 'production') {
            return true;
        }
        return false;
    }
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 forgot password attempts per hour per IP
    message: {
        error: 'Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 1 giờ.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    createAccountLimiter,
    loginLimiter,
    forgotPasswordLimiter
};