const { Router } = require('express');
const AuthController = require('../controllers/auth.controller');
const AuthGuard = require('../middlewares/auth.guard');
const validate = require('../middlewares/validate');
const authValidation = require('../validations/auth.validation');
const passport = require('passport');
const {
    createAccountLimiter,
    loginLimiter,
    forgotPasswordLimiter
} = require('../middlewares/rateLimiter');

const r = Router();

r.post('/register',
    createAccountLimiter,
    validate(authValidation.register),
    AuthController.register
);

r.post('/login',
    validate(authValidation.login), // Validation chạy trước để trả về 422 đúng cách
    loginLimiter, // Rate limit (sẽ skip trong development)
    AuthController.login
);

r.post('/refresh',
    validate(authValidation.refreshToken),
    AuthController.refresh
);

r.post('/logout',
    AuthGuard.guard,
    AuthController.logout
);

r.get('/me',
    AuthGuard.guard,
    AuthController.me
);

r.post('/change-password',
    AuthGuard.guard,
    validate(authValidation.changePassword),
    AuthController.changePassword
);

// Reset password flow
r.post('/forgot-password',
    forgotPasswordLimiter,
    validate(authValidation.forgotPassword),
    AuthController.forgotPassword
);

r.post('/reset-password',
    validate(authValidation.resetPassword),
    AuthController.resetPassword
);

// Email verification
r.post('/verify-email',
    validate(authValidation.verifyEmail),
    AuthController.verifyEmail
);

r.post('/resend-verification',
    AuthGuard.guard,
    AuthController.resendVerification
);

// Session management
r.get('/sessions',
    AuthGuard.guard,
    AuthController.listSessions
);

r.post('/logout-all',
    AuthGuard.guard,
    AuthController.logoutAll
);

r.delete('/sessions/:sessionId',
    AuthGuard.guard,
    AuthController.terminateSession
);

// Google OAuth routes
r.get('/google', AuthController.googleAuth);

r.get('/google/callback',
    passport.authenticate('google', { 
        failureRedirect: '/api/v1/auth/google/error', 
        session: false 
    }),
    AuthController.googleCallback
);

// Google OAuth error handler
r.get('/google/error', (req, res) => {
    const message = req.query.message || 'Đăng nhập Google thất bại';
    res.status(400).json({
        success: false,
        error: decodeURIComponent(message),
        code: 'GOOGLE_AUTH_ERROR'
    });
});

// Exchange OAuth code for tokens (secure)
r.post('/oauth/exchange', AuthController.exchangeOAuthCode);

module.exports = r;
