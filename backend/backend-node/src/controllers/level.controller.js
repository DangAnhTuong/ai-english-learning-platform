const LevelService = require('../services/level.service');
const AppError = require('../utils/AppError');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const LevelController = {
    /**
     * Tạo level mới
     * POST /api/v1/levels
     */
    createLevel: asyncHandler(async (req, res) => {
        const levelData = req.body;
        const userId = req.user.id;
        const userRoles = req.user.roles;

        if (!userRoles.includes('admin') && !userRoles.includes('teacher')) {
            throw new AppError('Bạn không có quyền tạo level', 403, 'INSUFFICIENT_PERMISSION');
        }

        const level = await LevelService.createLevel(levelData, userId);

        res.status(201).json({
            success: true,
            message: 'Tạo level thành công',
            data: level
        });
    }),

    /**
     * Lấy danh sách levels
     * GET /api/v1/levels
     */
    getLevels: asyncHandler(async (req, res) => {
        const {
            page = 1,
            limit = 100,
            sortBy = 'order',
            sortOrder = 'asc',
            isActive,
            search
        } = req.query;

        const filters = {
            // Hỗ trợ cả string 'true' (khi không có Joi) và boolean true (khi có Joi convert)
            isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : undefined,
            search
        };

        const pagination = {
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy,
            sortOrder
        };

        const result = await LevelService.getLevels(filters, pagination);

        res.json({
            success: true,
            data: result.levels,
            pagination: result.pagination
        });
    }),

    /**
     * Lấy level theo ID
     * GET /api/v1/levels/:id
     */
    getLevelById: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const level = await LevelService.getLevelById(id);

        res.json({
            success: true,
            data: level
        });
    }),

    /**
     * Cập nhật level
     * PUT /api/v1/levels/:id
     */
    updateLevel: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        const userId = req.user.id;
        const userRoles = req.user.roles;

        const level = await LevelService.updateLevel(id, updateData, userId, userRoles);

        res.json({
            success: true,
            message: 'Cập nhật level thành công',
            data: level
        });
    }),

    /**
     * Xóa level (soft delete)
     * DELETE /api/v1/levels/:id
     */
    deleteLevel: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;
        const userRoles = req.user.roles;

        await LevelService.deleteLevel(id, userId, userRoles);

        res.json({
            success: true,
            message: 'Xóa level thành công'
        });
    }),

    /**
     * Xóa vĩnh viễn level
     * DELETE /api/v1/levels/:id/permanent
     */
    permanentDeleteLevel: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userRoles = req.user.roles;

        await LevelService.permanentDeleteLevel(id, userRoles);

        res.json({
            success: true,
            message: 'Xóa vĩnh viễn level thành công'
        });
    })
};

module.exports = LevelController;
