const UserService = require('../services/user.service');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../constants/errorCodes');

// Wrapper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const UserController = {
    /**
     * Lấy danh sách users
     * GET /api/v1/admin/users
     */
    getUsers: asyncHandler(async (req, res) => {
        const filters = {
            status: req.query.status,
            roles: req.query.roles ? (Array.isArray(req.query.roles) ? req.query.roles : [req.query.roles]) : undefined,
            search: req.query.search,
            email: req.query.email,
            isEmailVerified: req.query.isEmailVerified
        };

        const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            sortBy: req.query.sortBy || 'createdAt',
            sortOrder: req.query.sortOrder || 'desc'
        };

        const result = await UserService.getUsers(filters, pagination);

        res.json({
            success: true,
            data: result
        });
    }),

    /**
     * Lấy user theo ID
     * GET /api/v1/admin/users/:userId
     */
    getUserById: asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const user = await UserService.getUserById(userId);

        res.json({
            success: true,
            data: { user }
        });
    }),

    /**
     * Tạo user mới
     * POST /api/v1/admin/users
     */
    createUser: asyncHandler(async (req, res) => {
        const user = await UserService.createUser(req.body);

        res.status(201).json({
            success: true,
            message: 'Tạo người dùng thành công',
            data: { user }
        });
    }),

    /**
     * Cập nhật user
     * PUT /api/v1/admin/users/:userId
     */
    /**
     * Cập nhật user (Bản sửa lỗi cấp quyền)
     * PUT /api/v1/admin/users/:userId
     */
    updateUser: asyncHandler(async (req, res) => {
        const { userId } = req.params;
        console.log('--- UserController.updateUser ---');
        console.log('req.body:', req.body);
        const result = await UserService.updateUser(userId, req.body);

        res.json({
            success: true,
            message: 'Cập nhật người dùng thành công',
            data: result // result lúc này đã là { user: ... }
        });
    }),

    /**
     * Xóa user
     * DELETE /api/v1/admin/users/:userId
     */
    deleteUser: asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const currentUserId = req.user?.id || req.user?._id;

        // Không cho phép tự xóa chính mình
        if (userId === currentUserId?.toString()) {
            return res.status(400).json({
                success: false,
                error: 'Không thể xóa tài khoản của chính mình',
                code: 'CANNOT_DELETE_SELF'
            });
        }

        const result = await UserService.deleteUser(userId);

        res.json({
            success: true,
            message: result.message
        });
    }),

    /**
     * Ban user
     * POST /api/v1/admin/users/:userId/ban
     */
    banUser: asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const currentUserId = req.user?.id || req.user?._id;

        // Không cho phép tự khóa chính mình
        if (userId === currentUserId?.toString()) {
            return res.status(400).json({
                success: false,
                error: 'Không thể khóa tài khoản của chính mình',
                code: 'CANNOT_BAN_SELF'
            });
        }

        const user = await UserService.banUser(userId);

        res.json({
            success: true,
            message: 'Đã khóa tài khoản người dùng',
            data: { user }
        });
    }),

    /**
     * Unban user
     * POST /api/v1/admin/users/:userId/unban
     */
    unbanUser: asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const user = await UserService.unbanUser(userId);

        res.json({
            success: true,
            message: 'Đã mở khóa tài khoản người dùng',
            data: { user }
        });
    }),

    /**
     * Cập nhật roles của user
     * PUT /api/v1/admin/users/:userId/roles
     */
    updateUserRoles: asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const { roles } = req.body;

        if (!roles || !Array.isArray(roles)) {
            throw new AppError('Roles phải là một mảng', 400, ErrorCodes.INVALID_INPUT);
        }

        const user = await UserService.updateUserRoles(userId, roles);

        res.json({
            success: true,
            message: 'Cập nhật vai trò thành công',
            data: { user }
        });
    }),

    /**
     * Lấy user statistics
     * GET /api/v1/admin/users/stats
     */
    getUserStats: asyncHandler(async (req, res) => {
        const stats = await UserService.getUserStats();

        res.json({
            success: true,
            data: { stats }
        });
    })
};

module.exports = UserController;
