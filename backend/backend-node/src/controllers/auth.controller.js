const AuthService = require('../services/auth.service');
const EmailService = require('../services/email.service');
const passport = require('passport');
const redisClient = require('../config/redis.config');

const AppError = require('../utils/AppError');

// Wrapper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const getFrontendUrl = () => {
    if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim()) {
        return process.env.FRONTEND_URL.trim();
    }
    return process.env.NODE_ENV === 'production'
        ? 'http://localhost'
        : 'http://localhost:3000';
};

const AuthController = {
    register: asyncHandler(async (req, res) => {
        const { email, password, name, username, phone } = req.body;
        const result = await AuthService.register({ email, password, name, username, phone });
        res.status(201).json(result);
    }),

    login: asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const ip = req.ip || req.connection.remoteAddress;
        const result = await AuthService.login({ email, password, ip });
        res.json(result);
    }),
    refresh: asyncHandler(async (req, res) => {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw AppError.badRequest('Refresh token is required', 'REFRESH_TOKEN_REQUIRED');
        }
        const out = await AuthService.refresh({ token: refreshToken });
        res.json({
            success: true,
            data: out
        });
    }),

    logout: asyncHandler(async (req, res) => {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw AppError.badRequest('Refresh token is required', 'REFRESH_TOKEN_REQUIRED');
        }
        await AuthService.logout({ userId: req.user.id, token: refreshToken });
        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    }),

    me: asyncHandler(async (req, res) => {
        res.json({
            success: true,
            data: { user: req.user }
        });
    }),

    changePassword: asyncHandler(async (req, res) => {
        const { oldPass, newPass } = req.body;
        if (!oldPass || !newPass) {
            throw AppError.badRequest('Thiếu thông tin mật khẩu', 'MISSING_PASSWORD_INFO');
        }
        await AuthService.changePassword({ userId: req.user.id, oldPass, newPass });
        res.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });
    }),

    forgotPassword: asyncHandler(async (req, res) => {
        const { email } = req.body;
        await AuthService.forgotPassword(email);
        res.json({
            success: true,
            message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.'
        });
    }),

    resetPassword: asyncHandler(async (req, res) => {
        const { token, newPassword } = req.body;
        await AuthService.resetPassword(token, newPassword);
        res.json({
            success: true,
            message: 'Mật khẩu đã được đặt lại thành công.'
        });
    }),

    verifyEmail: asyncHandler(async (req, res) => {
        const { token } = req.body;
        await AuthService.verifyEmail(token);
        res.json({
            success: true,
            message: 'Email đã được xác thực thành công.'
        });
    }),

    resendVerification: asyncHandler(async (req, res) => {
        await AuthService.resendVerification(req.user.id);
        res.json({
            success: true,
            message: 'Email xác thực đã được gửi lại.'
        });
    }),

    listSessions: asyncHandler(async (req, res) => {
        const sessions = await AuthService.listActiveSessions(req.user.id);
        res.json({ sessions });
    }),

    logoutAll: asyncHandler(async (req, res) => {
        await AuthService.logout({
            userId: req.user.id,
            all: true
        });
        res.json({
            success: true,
            message: 'Đã đăng xuất khỏi tất cả các thiết bị.'
        });
    }),

    terminateSession: asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        await AuthService.terminateSession(req.user.id, sessionId);
        res.json({
            success: true,
            message: 'Phiên đăng nhập đã được kết thúc.'
        });
    }),

    // Google OAuth routes
    googleAuth: asyncHandler(async (req, res, next) => {
        // Tạo state token để bảo vệ CSRF
        const crypto = require('crypto');
        const state = crypto.randomBytes(32).toString('hex');
        
        // Lưu state vào cookie với httpOnly (bảo mật hơn)
        res.cookie('oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 600000 // 10 phút
        });

        // Passport authenticate với state trong query
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            state: state
        })(req, res, next);
    }),

    googleCallback: asyncHandler(async (req, res) => {
        try {
            // Verify state để chống CSRF
            const stateFromCookie = req.cookies?.oauth_state;
            const stateFromQuery = req.query?.state;
            
            if (!stateFromCookie || !stateFromQuery || stateFromCookie !== stateFromQuery) {
                // Xóa cookie
                res.clearCookie('oauth_state');
                throw new AppError({
                    error: 'State verification failed - possible CSRF attack',
                    code: 'OAUTH_STATE_MISMATCH'
                }, 403);
            }

            // Xóa state cookie sau khi verify
            res.clearCookie('oauth_state');

            // req.user contains Google profile from passport
            if (!req.user) {
                throw new AppError({
                    error: 'Không nhận được thông tin từ Google',
                    code: 'GOOGLE_AUTH_ERROR'
                }, 400);
            }

            // Process Google authentication and get tokens
            const result = await AuthService.googleAuth(req.user);

            // Tạo temporary code để exchange tokens (an toàn hơn - không expose tokens trong URL)
            const crypto = require('crypto');
            const tempCode = crypto.randomBytes(32).toString('hex');
            
            // Lưu tokens vào Redis
            const tokenData = {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                user: result.user
            };
            
            // Lưu với expiry 60 giây (tương đương 60000ms)
            await redisClient.setEx(`oauth_code:${tempCode}`, 60, JSON.stringify(tokenData));

            const frontendUrl = getFrontendUrl();
            
            // Redirect to frontend với code thay vì tokens trực tiếp (bảo mật hơn)
            const redirectUrl = `${frontendUrl}/auth/callback?code=${tempCode}`;

            res.redirect(redirectUrl);
        } catch (error) {
            console.error('Google callback error:', error);
            const frontendUrl = getFrontendUrl();
            const errorMessage = encodeURIComponent(error.message || 'Đăng nhập Google thất bại');
            res.redirect(`${frontendUrl}/auth/error?message=${errorMessage}`);
        }
    }),

    // Exchange OAuth code for tokens (secure token exchange)
    exchangeOAuthCode: asyncHandler(async (req, res) => {
        try {
            const { code } = req.body;

            if (!code) {
                throw new AppError({
                    error: 'Code is required',
                    code: 'OAUTH_CODE_REQUIRED'
                }, 400);
            }

            // Lấy tokens từ Redis store
            const tokenDataStr = await redisClient.get(`oauth_code:${code}`);
            
            if (!tokenDataStr) {
                throw new AppError({
                    error: 'Code expired or invalid',
                    code: 'OAUTH_CODE_INVALID'
                }, 400);
            }

            const tokenData = JSON.parse(tokenDataStr);

            // Xóa code sau khi sử dụng (one-time use)
            await redisClient.del(`oauth_code:${code}`);

            // Return tokens và user data
            res.json({
                success: true,
                data: {
                    accessToken: tokenData.accessToken,
                    refreshToken: tokenData.refreshToken,
                    user: tokenData.user
                }
            });
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError({
                error: 'Failed to exchange OAuth code',
                code: 'OAUTH_EXCHANGE_FAILED'
            }, 500);
        }
    }),

    verifyGoogleToken: asyncHandler(async (req, res) => {
        const { token } = req.body;
        if (!token) {
            throw new AppError('Token is required', 400, 'TOKEN_REQUIRED');
        }

        try {
            let profile;
            const { OAuth2Client } = require('google-auth-library');
            const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '151027052858-mmdiucsj3s8ddkmfk0rieanmhojts1np.apps.googleusercontent.com');

            // Try to verify as ID Token first
            try {
                const ticket = await googleClient.verifyIdToken({
                    idToken: token,
                    audience: [
                        '151027052858-mmdiucsj3s8ddkmfk0rieanmhojts1np.apps.googleusercontent.com', 
                        process.env.GOOGLE_CLIENT_ID
                    ].filter(Boolean)
                });
                const payload = ticket.getPayload();
                profile = {
                    id: payload.sub,
                    emails: [{ value: payload.email }],
                    displayName: payload.name,
                    photos: [{ value: payload.picture }]
                };
            } catch (err) {
                // If ID Token verification fails, it might be an Access Token
                const axios = require('axios');
                const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const payload = response.data;
                profile = {
                    id: payload.sub,
                    emails: [{ value: payload.email }],
                    displayName: payload.name,
                    photos: [{ value: payload.picture }]
                };
            }

            if (!profile || !profile.emails || !profile.emails[0].value) {
                throw new AppError('Failed to get user profile from Google', 400, 'GOOGLE_AUTH_ERROR');
            }

            // Process Google authentication and get tokens
            const result = await AuthService.googleAuth(profile);

            // Return tokens and user data directly to React
            res.json(result);
        } catch (error) {
            console.error('Google verification error:', error);
            if (error instanceof AppError) throw error;
            throw new AppError('Google authentication failed', 401, 'GOOGLE_AUTH_FAILED');
        }
    })
};

module.exports = AuthController;
