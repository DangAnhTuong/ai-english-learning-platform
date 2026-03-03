const Jwt = require('../utils/jwt');
const User = require('../models/userSchema');
const { RolePermissions } = require('../constants/permissions');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../constants/errorCodes');

const AuthGuard = {
    async guard(req, res, next) {
        try {
            const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
            if (!token) {
                throw new AppError('Token không được cung cấp', 401, ErrorCodes.AUTH_TOKEN_MISSING);
            }

            const payload = Jwt.verifyAccess(token);
            const user = await User.findById(payload.sub).select('+roles +status');

            if (!user) {
                throw new AppError('Người dùng không tồn tại', 401, ErrorCodes.USER_NOT_FOUND);
            }

            if (payload.tv !== user.tokenVersion) {
                throw new AppError('Token không hợp lệ', 401, ErrorCodes.AUTH_TOKEN_INVALID);
            }

            if (user.status === 'banned') {
                throw new AppError('Tài khoản đã bị khóa', 403, ErrorCodes.AUTH_ACCOUNT_DISABLED);
            }

            if (user.status === 'inactive') {
                throw new AppError('Tài khoản chưa được kích hoạt', 403, ErrorCodes.AUTH_ACCOUNT_DISABLED);
            }

            // Collect all permissions from user roles
            const userPermissions = new Set();
            user.roles.forEach(role => {
                if (RolePermissions[role]) {
                    RolePermissions[role].forEach(permission => {
                        userPermissions.add(permission);
                    });
                }
            });

            req.user = {
                id: user._id,
                email: user.email,
                name: user.name,
                roles: user.roles,
                permissions: Array.from(userPermissions),
                status: user.status
            };

            next();
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({
                    success: false,
                    error: error.message,
                    code: error.code
                });
            }

            res.status(401).json({
                success: false,
                error: 'Token không hợp lệ',
                code: ErrorCodes.AUTH_TOKEN_INVALID
            });
        }
    },

    requireRoles(roles = []) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Chưa xác thực',
                    code: ErrorCodes.AUTH_TOKEN_MISSING
                });
            }

            const hasRole = req.user.roles.some(role => roles.includes(role));
            if (!hasRole) {
                return res.status(403).json({
                    success: false,
                    error: 'Không đủ quyền truy cập',
                    code: ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS
                });
            }

            next();
        };
    },

    requirePermissions(permissions = []) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Chưa xác thực',
                    code: ErrorCodes.AUTH_TOKEN_MISSING
                });
            }

            const hasPermission = permissions.every(permission =>
                req.user.permissions.includes(permission)
            );

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    error: 'Không đủ quyền thực hiện hành động này',
                    code: ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS,
                    details: {
                        requiredPermissions: permissions,
                        userPermissions: req.user.permissions
                    }
                });
            }

            next();
        };
    },

    requireAnyPermission(permissions = []) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Chưa xác thực',
                    code: ErrorCodes.AUTH_TOKEN_MISSING
                });
            }

            const hasAnyPermission = permissions.some(permission =>
                req.user.permissions.includes(permission)
            );

            if (!hasAnyPermission) {
                return res.status(403).json({
                    success: false,
                    error: 'Không đủ quyền thực hiện hành động này',
                    code: ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS,
                    details: {
                        requiredPermissions: permissions,
                        userPermissions: req.user.permissions
                    }
                });
            }

            next();
        };
    },

    async optionalAuth(req, res, next) {
        try {
            const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');

            if (!token) {
                req.user = null;
                return next();
            }

            // Try to authenticate, but don't fail if token is invalid
            const payload = Jwt.verifyAccess(token);
            const user = await User.findById(payload.sub).select('+roles +status');

            if (!user || payload.tv !== user.tokenVersion || user.status === 'banned' || user.status === 'inactive') {
                req.user = null;
                return next();
            }

            // Collect all permissions from user roles
            const userPermissions = new Set();
            user.roles.forEach(role => {
                if (RolePermissions[role]) {
                    RolePermissions[role].forEach(permission => {
                        userPermissions.add(permission);
                    });
                }
            });

            req.user = {
                id: user._id,
                email: user.email,
                name: user.name,
                roles: user.roles,
                permissions: Array.from(userPermissions),
                status: user.status
            };

            next();
        } catch (error) {
            // If authentication fails, just continue without user
            req.user = null;
            next();
        }
    }
};

module.exports = AuthGuard;
