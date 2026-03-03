const Level = require('../models/level');
const AppError = require('../utils/AppError');

class LevelService {
    /**
     * Tạo level mới
     * @param {Object} levelData - Dữ liệu level
     * @param {string} userId - ID người tạo
     * @returns {Promise<Object>} Level đã tạo
     */
    static async createLevel(levelData, userId) {
        const { name, code, description, order } = levelData;

        // Kiểm tra trùng lặp name
        const existingByName = await Level.findOne({ name });
        if (existingByName) {
            throw new AppError('Tên level đã tồn tại', 400, 'DUPLICATE_NAME');
        }

        // Kiểm tra trùng lặp code
        const existingByCode = await Level.findOne({ code: code.toUpperCase() });
        if (existingByCode) {
            throw new AppError('Mã level đã tồn tại', 400, 'DUPLICATE_CODE');
        }

        const level = await Level.create({
            name,
            code: code.toUpperCase(),
            description,
            order: order || 0,
            createdBy: userId,
            lastModifiedBy: userId
        });

        return level;
    }

    /**
     * Lấy danh sách levels
     * @param {Object} filters - Bộ lọc
     * @param {Object} pagination - Phân trang
     * @returns {Promise<Object>} Danh sách levels và metadata
     */
    static async getLevels(filters = {}, pagination = {}) {
        const {
            page = 1,
            limit = 100,
            sortBy = 'order',
            sortOrder = 'asc'
        } = pagination;

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const query = {};
        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive;
        }
        if (filters.search) {
            query.$or = [
                { name: new RegExp(filters.search, 'i') },
                { code: new RegExp(filters.search, 'i') }
            ];
        }

        const levels = await Level.find(query)
            .populate('creator', 'name email')
            .populate('lastModifier', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const total = await Level.countDocuments(query);

        return {
            levels,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Lấy level theo ID
     * @param {string} id - ID level
     * @returns {Promise<Object>} Level
     */
    static async getLevelById(id) {
        const level = await Level.findById(id)
            .populate('creator', 'name email')
            .populate('lastModifier', 'name email');

        if (!level) {
            throw new AppError('Level không tồn tại', 404, 'LEVEL_NOT_FOUND');
        }

        return level;
    }

    /**
     * Cập nhật level
     * @param {string} id - ID level
     * @param {Object} updateData - Dữ liệu cập nhật
     * @param {string} userId - ID người cập nhật
     * @param {Array} userRoles - Vai trò người dùng
     * @returns {Promise<Object>} Level đã cập nhật
     */
    static async updateLevel(id, updateData, userId, userRoles) {
        const level = await Level.findById(id);
        if (!level) {
            throw new AppError('Level không tồn tại', 404, 'LEVEL_NOT_FOUND');
        }

        // Kiểm tra quyền
        if (!userRoles.includes('admin') && !userRoles.includes('teacher')) {
            throw new AppError('Bạn không có quyền cập nhật level', 403, 'INSUFFICIENT_PERMISSION');
        }

        // Kiểm tra trùng lặp name nếu có thay đổi
        if (updateData.name && updateData.name !== level.name) {
            const existing = await Level.findOne({ name: updateData.name });
            if (existing) {
                throw new AppError('Tên level đã tồn tại', 400, 'DUPLICATE_NAME');
            }
        }

        // Kiểm tra trùng lặp code nếu có thay đổi
        if (updateData.code && updateData.code.toUpperCase() !== level.code) {
            const existing = await Level.findOne({ code: updateData.code.toUpperCase() });
            if (existing) {
                throw new AppError('Mã level đã tồn tại', 400, 'DUPLICATE_CODE');
            }
            updateData.code = updateData.code.toUpperCase();
        }

        Object.assign(level, updateData);
        level.lastModifiedBy = userId;
        await level.save();

        return level;
    }

    /**
     * Xóa level (soft delete)
     * @param {string} id - ID level
     * @param {string} userId - ID người xóa
     * @param {Array} userRoles - Vai trò người dùng
     * @returns {Promise<void>}
     */
    static async deleteLevel(id, userId, userRoles) {
        const level = await Level.findById(id);
        if (!level) {
            throw new AppError('Level không tồn tại', 404, 'LEVEL_NOT_FOUND');
        }

        // Kiểm tra quyền
        if (!userRoles.includes('admin') && !userRoles.includes('teacher')) {
            throw new AppError('Bạn không có quyền xóa level', 403, 'INSUFFICIENT_PERMISSION');
        }

        level.isActive = false;
        level.lastModifiedBy = userId;
        await level.save();
    }

    /**
     * Xóa vĩnh viễn level
     * @param {string} id - ID level
     * @param {Array} userRoles - Vai trò người dùng
     * @returns {Promise<void>}
     */
    static async permanentDeleteLevel(id, userRoles) {
        if (!userRoles.includes('admin')) {
            throw new AppError('Chỉ admin mới có quyền xóa vĩnh viễn', 403, 'INSUFFICIENT_PERMISSION');
        }

        const level = await Level.findById(id);
        if (!level) {
            throw new AppError('Level không tồn tại', 404, 'LEVEL_NOT_FOUND');
        }

        await Level.findByIdAndDelete(id);
    }
}

module.exports = LevelService;
