const AppError = require('../utils/AppError');

class RoleGuard {
    /**
     * Middleware kiểm tra vai trò người dùng
     * @param {Array} allowedRoles - Danh sách vai trò được phép
     * @returns {Function} Middleware function
     */
    static requireRoles(allowedRoles) {
        return (req, res, next) => {
            try {
                // Kiểm tra xem user đã được xác thực chưa
                if (!req.user) {
                    throw new AppError('Chưa xác thực người dùng', 401, 'UNAUTHENTICATED');
                }

                const userRoles = req.user.roles || [];

                // Kiểm tra xem user có ít nhất một vai trò được phép không
                const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

                if (!hasRequiredRole) {
                    throw new AppError(
                        `Bạn cần có một trong các vai trò: ${allowedRoles.join(', ')}`,
                        403,
                        'INSUFFICIENT_PERMISSION'
                    );
                }

                next();
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * Middleware kiểm tra quyền admin
     * @returns {Function} Middleware function
     */
    static requireAdmin() {
        return this.requireRoles(['admin']);
    }

    /**
     * Middleware kiểm tra quyền teacher hoặc admin
     * @returns {Function} Middleware function
     */
    static requireTeacherOrAdmin() {
        return this.requireRoles(['admin', 'teacher']);
    }

    /**
     * Middleware kiểm tra quyền student, teacher hoặc admin
     * @returns {Function} Middleware function
     */
    static requireAnyRole() {
        return this.requireRoles(['admin', 'teacher', 'student']);
    }

    /**
     * Middleware kiểm tra quyền sở hữu tài nguyên
     * @param {string} resourceUserIdField - Tên trường chứa user ID trong resource
     * @param {Array} allowedRoles - Vai trò được phép (ngoài owner)
     * @returns {Function} Middleware function
     */
    static requireOwnershipOrRole(resourceUserIdField = 'createdBy', allowedRoles = ['admin']) {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    throw new AppError('Chưa xác thực người dùng', 401, 'UNAUTHENTICATED');
                }

                const userRoles = req.user.roles || [];
                const userId = req.user.id;

                // Kiểm tra xem user có vai trò được phép không
                const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));

                if (hasAllowedRole) {
                    return next();
                }

                // Kiểm tra quyền sở hữu (cần resource trong req.resource)
                if (req.resource && req.resource[resourceUserIdField]) {
                    const resourceUserId = req.resource[resourceUserIdField].toString();
                    if (resourceUserId === userId.toString()) {
                        return next();
                    }
                }

                throw new AppError(
                    'Bạn không có quyền truy cập tài nguyên này',
                    403,
                    'INSUFFICIENT_PERMISSION'
                );
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * Middleware kiểm tra quyền dựa trên điều kiện tùy chỉnh
     * @param {Function} checkPermission - Function kiểm tra quyền
     * @returns {Function} Middleware function
     */
    static requireCustom(checkPermission) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new AppError('Chưa xác thực người dùng', 401, 'UNAUTHENTICATED');
                }

                const hasPermission = await checkPermission(req.user, req);

                if (!hasPermission) {
                    throw new AppError(
                        'Bạn không có quyền thực hiện hành động này',
                        403,
                        'INSUFFICIENT_PERMISSION'
                    );
                }

                next();
            } catch (error) {
                next(error);
            }
        };
    }
}

module.exports = RoleGuard;

