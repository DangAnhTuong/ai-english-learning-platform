const crypto = require('crypto');
const User = require('../models/userSchema');
const Password = require('../utils/password');
const Jwt = require('../utils/jwt');
const SecurityLogger = require('./security.logger');
const EmailService = require('./email.service');
const AppError = require('../utils/AppError');

// Helper functions
const sanitizeUser = (user) => {
    const { passwordHash, refreshTokens, resetPasswordToken, resetPasswordExpires, ...sanitized } = user.toObject();
    return sanitized;
};

const issueTokens = async (user) => {
    const jti = crypto.randomUUID();
    const refreshToken = Jwt.signRefresh({ sub: user._id, jti });
    const accessToken = Jwt.signAccess({ sub: user._id, roles: user.roles, tv: user.tokenVersion });

    user.refreshTokens.push({ jti, expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) });
    await user.save();

    return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken
    };
};

const AuthService = {
    async register({ email, password, name, username, phone }) {
        // Kiểm tra trùng lặp email
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            throw new AppError({
                error: 'Email đã được đăng ký',
                code: '409',
            }, 409);
        }

        // Kiểm tra trùng lặp username
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            throw new AppError({
                error: 'Tên người dùng đã được sử dụng',
                code: '409',
            }, 409);
        }

        // Kiểm tra trùng lặp phone
        const phoneExists = await User.findOne({ phone });
        if (phoneExists) {
            throw new AppError({
                error: 'Số điện thoại đã được đăng ký',
                code: '409',
            }, 409);
        }

        try {
            const passwordHash = await Password.hash(password);

            // Tạo token xác thực email
            const emailVerificationToken = crypto.randomBytes(32).toString('hex');
            const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            const user = await User.create({
                email,
                passwordHash,
                name,
                username,
                phone,
                emailVerificationToken,
                emailVerificationExpires
            });

            // Gửi email xác thực
            try {
                await EmailService.sendEmailVerification(email, emailVerificationToken);
            } catch (emailError) {
                console.error('Failed to send verification email:', emailError);
                // Không throw error để không làm gián đoạn quá trình đăng ký
            }

            return await issueTokens(user);
        } catch (error) {
            console.error('Registration error:', error);

            // Xử lý lỗi duplicate key từ MongoDB
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                let message = 'Thông tin đã được sử dụng';
                if (field === 'email') message = 'Email đã được đăng ký';
                else if (field === 'username') message = 'Tên người dùng đã được sử dụng';
                else if (field === 'phone') message = 'Số điện thoại đã được đăng ký';

                throw new AppError({
                    error: message,
                    code: '409',
                }, 409);
            }

            throw new AppError({
                error: 'Không thể đăng ký tài khoản',
                code: '500',
                details: error.message
            }, 500);
        }
    },

    async login({ email, password, ip }) {
        try {
            const user = await User.findOne({ email }).select('+passwordHash');

            // Check if account exists
            if (!user) {
                SecurityLogger.logLoginAttempt({
                    email,
                    success: false,
                    ip,
                    reason: 'user_not_found'
                });
                throw new AppError('Email hoặc mật khẩu không đúng', 401, 'INVALID_CREDENTIALS');
            }

            // Check if account is locked
            if (user.lockUntil && user.lockUntil > Date.now()) {
                SecurityLogger.logLoginAttempt({
                    userId: user._id,
                    email,
                    success: false,
                    ip,
                    reason: 'account_locked'
                });
                throw new AppError('Tài khoản tạm thời bị khóa. Vui lòng thử lại sau.', 423, 'ACCOUNT_LOCKED');
            }

            // Verify password
            if (!(await Password.verify(user.passwordHash, password))) {
                user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

                // Lock account after 5 failed attempts
                if (user.failedLoginAttempts >= 5) {
                    user.lockUntil = Date.now() + (30 * 60 * 1000); // 30 minutes
                    SecurityLogger.logAccountLocked({
                        userId: user._id,
                        reason: 'too_many_failed_attempts'
                    });
                }

                await user.save();

                SecurityLogger.logLoginAttempt({
                    userId: user._id,
                    email,
                    success: false,
                    ip,
                    reason: 'invalid_password'
                });

                throw new AppError('Email hoặc mật khẩu không đúng', 401, 'INVALID_CREDENTIALS');
            }

            // Reset failed attempts on successful login
            if (user.failedLoginAttempts || user.lockUntil) {
                user.failedLoginAttempts = 0;
                user.lockUntil = null;
                await user.save();
            }

            SecurityLogger.logLoginAttempt({
                userId: user._id,
                email,
                success: true,
                ip
            });

            return await issueTokens(user);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Không thể đăng nhập', 500, 'LOGIN_FAILED');
        }
    },

    async refresh({ token }) {
        try {
            let payload;
            try {
                payload = Jwt.verifyRefresh(token);
            } catch {
                throw new AppError('Token không hợp lệ', 401, 'INVALID_REFRESH_TOKEN');
            }

            const user = await User.findById(payload.sub);
            if (!user) {
                throw new AppError('Người dùng không tồn tại', 404, 'USER_NOT_FOUND');
            }

            const valid = user.refreshTokens.find(t => t.jti === payload.jti);
            if (!valid || valid.expiresAt < new Date()) {
                user.refreshTokens = [];
                await user.save();
                throw new AppError('Token đã hết hạn hoặc đã được sử dụng', 401, 'REFRESH_TOKEN_EXPIRED');
            }

            // Rotate refresh token
            user.refreshTokens = user.refreshTokens.filter(t => t.jti !== payload.jti);
            await user.save();

            return await issueTokens(user);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Không thể refresh token', 500, 'REFRESH_FAILED');
        }
    },

    async logout({ userId, token, all = false }) {
        try {
            if (all) {
                // Logout from all devices
                await User.updateOne(
                    { _id: userId },
                    {
                        $set: {
                            refreshTokens: [],
                            tokenVersion: (await User.findById(userId)).tokenVersion + 1
                        }
                    }
                );
                SecurityLogger.logSuspiciousActivity({
                    userId,
                    activity: 'logout_all_devices'
                });
            } else {
                // Logout from current device only
                const { jti } = Jwt.verifyRefresh(token);
                await User.updateOne(
                    { _id: userId },
                    { $pull: { refreshTokens: { jti } } }
                );
            }
            return true;
        } catch (error) {
            SecurityLogger.logSuspiciousActivity({
                userId,
                activity: 'logout_failed',
                error: error.message
            });
            return false;
        }
    },

    async listActiveSessions(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('Người dùng không tồn tại', 404, 'USER_NOT_FOUND');
        }

        return user.refreshTokens.map(token => ({
            id: token.jti,
            createdAt: token._id.getTimestamp(),
            expiresAt: token.expiresAt
        }));
    },

    async changePassword({ userId, oldPass, newPass }) {
        const user = await User.findById(userId).select('+passwordHash');
        if (!user || !(await Password.verify(user.passwordHash, oldPass))) {
            SecurityLogger.logPasswordChange({
                userId,
                method: 'change',
                success: false,
                reason: 'invalid_old_password'
            });
            throw new AppError('Mật khẩu cũ không đúng', 400, 'INVALID_OLD_PASSWORD');
        }

        user.passwordHash = await Password.hash(newPass);
        user.tokenVersion += 1;
        user.refreshTokens = [];
        user.lastPasswordChange = new Date();
        await user.save();

        SecurityLogger.logPasswordChange({
            userId,
            method: 'change',
            success: true
        });

        return true;
    },

    async forgotPassword(email) {
        const user = await User.findOne({ email });
        if (!user) return; // Silent fail for security

        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        try {
            await EmailService.sendPasswordReset(email, token);
            SecurityLogger.logPasswordChange({
                userId: user._id,
                method: 'forgot_password_request',
                success: true
            });
        } catch (error) {
            SecurityLogger.logPasswordChange({
                userId: user._id,
                method: 'forgot_password_request',
                success: false,
                error: error.message
            });
            throw new AppError('Không thể gửi email khôi phục mật khẩu', 500, 'EMAIL_SEND_FAILED');
        }
    },

    async resetPassword(token, newPassword) {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            SecurityLogger.logPasswordChange({
                method: 'reset',
                success: false,
                reason: 'invalid_token'
            });
            throw new AppError('Token không hợp lệ hoặc đã hết hạn', 400, 'INVALID_RESET_TOKEN');
        }

        user.passwordHash = await Password.hash(newPassword);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.tokenVersion += 1;
        user.refreshTokens = [];
        user.lastPasswordChange = new Date();
        await user.save();

        SecurityLogger.logPasswordChange({
            userId: user._id,
            method: 'reset',
            success: true
        });

        return true;
    },

    async verifyEmail(token) {
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            throw new AppError('Token xác thực không hợp lệ hoặc đã hết hạn', 400, 'INVALID_VERIFICATION_TOKEN');
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        user.status = 'active';
        await user.save();

        SecurityLogger.logEmailVerification({
            userId: user._id,
            email: user.email,
            success: true
        });

        return true;
    },

    async resendVerification(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('Người dùng không tồn tại', 404, 'USER_NOT_FOUND');
        }

        if (user.isEmailVerified) {
            throw new AppError('Email đã được xác thực', 400, 'EMAIL_ALREADY_VERIFIED');
        }

        // Tạo token mới
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        user.emailVerificationToken = emailVerificationToken;
        user.emailVerificationExpires = emailVerificationExpires;
        await user.save();

        try {
            await EmailService.sendEmailVerification(user.email, emailVerificationToken);
            return true;
        } catch (error) {
            throw new AppError('Không thể gửi email xác thực', 500, 'EMAIL_SEND_FAILED');
        }
    },

    async googleAuth(profile) {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
                throw new Error('Google profile did not return an email address.');
            }

            // Check if user already exists with this Google ID
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
                // Update last login
                user.lastLoginAt = new Date();
                user.totalLogins = (user.totalLogins || 0) + 1;
                await user.save();

                SecurityLogger.logLoginAttempt({
                    userId: user._id,
                    email: user.email,
                    success: true,
                    method: 'google'
                });

                return await issueTokens(user);
            }

            // Check if user exists with this email
            user = await User.findOne({ email });

            if (user) {
                // Link Google account to existing user
                user.googleId = profile.id;
                user.avatar = profile.photos?.[0]?.value;
                user.isEmailVerified = true;
                user.authProvider = 'google';
                user.lastLoginAt = new Date();
                user.totalLogins = (user.totalLogins || 0) + 1;
                await user.save();

                SecurityLogger.logLoginAttempt({
                    userId: user._id,
                    email: user.email,
                    success: true,
                    method: 'google_link'
                });

                return await issueTokens(user);
            }

            // Generate username from email for Google OAuth users
            const username = email.split('@')[0] + '_' + Date.now().toString().slice(-6);

            // Create new user
            user = await User.create({
                googleId: profile.id,
                email: email,
                name: profile.displayName || email.split('@')[0],
                username: username,
                phone: '', // Optional for Google OAuth users
                avatar: profile.photos?.[0]?.value,
                passwordHash: 'google-oauth',
                isEmailVerified: true,
                status: 'active',
                authProvider: 'google',
                lastLoginAt: new Date(),
                totalLogins: 1
            });

            SecurityLogger.logLoginAttempt({
                userId: user._id,
                email: user.email,
                success: true,
                method: 'google_register'
            });

            return await issueTokens(user);
        } catch (error) {
            console.error('Google auth error:', error);
            throw new AppError({
                error: 'Không thể đăng nhập bằng Google',
                code: 'GOOGLE_AUTH_FAILED'
            }, 500);
        }
    }
};

module.exports = AuthService;