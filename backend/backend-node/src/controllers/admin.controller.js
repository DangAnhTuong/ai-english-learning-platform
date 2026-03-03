const AdminService = require('../services/admin.service');
const AppError = require('../utils/AppError');

// Wrapper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const AdminController = {
    /**
     * Lấy thống kê Dashboard
     * GET /api/admin/dashboard
     */
    getDashboardStats: asyncHandler(async (req, res) => {
        const stats = await AdminService.getDashboardStats();
        res.json({
            success: true,
            data: stats
        });
    }),

    /**
     * Lấy hồ sơ chi tiết giáo viên
     * GET /api/admin/teachers/:id/profile
     */
    getTeacherProfile: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const profile = await AdminService.getTeacherProfile(id);
        res.json({
            success: true,
            data: profile
        });
    }),

    /**
     * Lấy danh sách thống kê giáo viên
     * GET /api/admin/teachers/stats
     */
    getTeacherStats: asyncHandler(async (req, res) => {
        const stats = await AdminService.getTeacherStats();
        res.json({
            success: true,
            data: stats
        });
    }),

    /**
     * Lấy danh sách giáo viên chờ duyệt
     * GET /api/admin/teachers/pending
     */
    getPendingTeachers: asyncHandler(async (req, res) => {
        const teachers = await AdminService.getPendingTeachers();
        res.json({
            success: true,
            data: teachers
        });
    }),

    /**
     * Duyệt giáo viên
     * POST /api/admin/teachers/:id/approve
     */
    approveTeacher: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const teacher = await AdminService.approveTeacher(id);
        res.json({
            success: true,
            message: 'Đã duyệt giáo viên thành công',
            data: teacher
        });
    }),

    /**
     * Từ chối giáo viên
     * POST /api/admin/teachers/:id/reject
     */
    rejectTeacher: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { reason } = req.body;
        const teacher = await AdminService.rejectTeacher(id, reason);
        res.json({
            success: true,
            message: 'Đã từ chối giáo viên',
            data: teacher
        });
    }),

    /**
     * Lấy hồ sơ chi tiết học viên
     * GET /api/admin/students/:id/profile
     */
    getStudentProfile: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const profile = await AdminService.getStudentProfile(id);
        res.json({
            success: true,
            data: profile
        });
    }),

    /**
     * Lấy danh sách thống kê học viên
     * GET /api/admin/students/stats
     */
    getStudentStats: asyncHandler(async (req, res) => {
        const stats = await AdminService.getStudentStats();
        res.json({
            success: true,
            data: stats
        });
    }),

    /**
     * Cập nhật level cho học viên
     * PUT /api/admin/students/:id/level
     */
    updateStudentLevel: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { level } = req.body;

        if (!level) {
            throw new AppError('Vui lòng cung cấp level mới', 400, 'MISSING_LEVEL');
        }

        const learningProfile = await AdminService.updateStudentLevel(id, level);
        res.json({
            success: true,
            message: 'Đã cập nhật level thành công',
            data: learningProfile
        });
    }),

    /**
     * Cập nhật subscription cho học viên
     * PUT /api/admin/students/:id/subscription
     */
    updateStudentSubscription: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const subscriptionData = req.body;

        const subscription = await AdminService.updateStudentSubscription(id, subscriptionData);
        res.json({
            success: true,
            message: 'Đã cập nhật gói học thành công',
            data: subscription
        });
    })
};

module.exports = AdminController;
