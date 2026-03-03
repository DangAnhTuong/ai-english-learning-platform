const ProfileService = require('../services/profile.service');
const AppError = require('../utils/AppError');

// Wrapper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const ProfileController = {
    /**
     * Lấy thông tin profile đầy đủ
     */
    getFullProfile: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const result = await ProfileService.getFullProfile(userId);
        res.json({
            success: true,
            data: result
        });
    }),

    /**
     * Cập nhật thông tin cá nhân
     */
    updateProfile: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const updateData = req.body;
        
        const result = await ProfileService.updateProfile(userId, updateData);
        res.json({
            success: true,
            message: 'Cập nhật hồ sơ thành công',
            data: result
        });
    }),

    /**
     * Upload avatar
     */
    uploadAvatar: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        
        if (!req.file) {
            throw new AppError('Vui lòng chọn file ảnh để upload', 400, 'NO_FILE_UPLOADED');
        }

        const result = await ProfileService.uploadAvatar(userId, req.file);
        res.json({
            success: true,
            message: 'Upload ảnh đại diện thành công',
            data: result
        });
    }),

    /**
     * Cập nhật learning profile
     */
    updateLearningProfile: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const updateData = req.body;
        
        const result = await ProfileService.updateLearningProfile(userId, updateData);
        res.json({
            success: true,
            message: 'Cập nhật hồ sơ học tập thành công',
            data: result
        });
    }),

    /**
     * Lấy tiến độ học tập
     */
    getLearningProgress: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const result = await ProfileService.getLearningProgress(userId);
        res.json({
            success: true,
            data: result
        });
    }),

    /**
     * Lấy lịch sử học tập
     */
    getLearningHistory: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        
        const result = await ProfileService.getLearningHistory(userId, {
            page: parseInt(page),
            limit: parseInt(limit)
        });
        res.json({
            success: true,
            data: result
        });
    }),

    /**
     * Đổi mật khẩu
     */
    changePassword: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            throw new AppError('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới', 400, 'MISSING_PASSWORD');
        }

        if (newPassword.length < 6) {
            throw new AppError('Mật khẩu mới phải có ít nhất 6 ký tự', 400, 'PASSWORD_TOO_SHORT');
        }

        const result = await ProfileService.changePassword(userId, currentPassword, newPassword);
        res.json({
            success: true,
            ...result
        });
    }),

    /**
     * Đặt mật khẩu cho tài khoản Google
     */
    setPassword: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { password } = req.body;
        
        if (!password) {
            throw new AppError('Vui lòng nhập mật khẩu mới', 400, 'MISSING_PASSWORD');
        }

        if (password.length < 6) {
            throw new AppError('Mật khẩu phải có ít nhất 6 ký tự', 400, 'PASSWORD_TOO_SHORT');
        }

        const result = await ProfileService.setPassword(userId, password);
        res.json({
            success: true,
            ...result
        });
    }),

    /**
     * Kiểm tra xem tài khoản có mật khẩu không
     */
    hasPassword: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const result = await ProfileService.hasPassword(userId);
        res.json({
            success: true,
            data: result
        });
    })
};

module.exports = ProfileController;
