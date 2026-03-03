const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const AuthGuard = require('../middlewares/auth.guard');
const RoleGuard = require('../middlewares/role.guard');

// Tất cả routes admin yêu cầu đăng nhập và có role admin
router.use(AuthGuard.guard, RoleGuard.requireRoles(['admin']));

// === DASHBOARD ===
router.get('/dashboard', AdminController.getDashboardStats);

// === QUẢN LÝ GIÁO VIÊN ===
// Danh sách thống kê giáo viên
router.get('/teachers/stats', AdminController.getTeacherStats);

// Danh sách giáo viên chờ duyệt
router.get('/teachers/pending', AdminController.getPendingTeachers);

// Chi tiết hồ sơ giáo viên
router.get('/teachers/:id/profile', AdminController.getTeacherProfile);

// Duyệt giáo viên
router.post('/teachers/:id/approve', AdminController.approveTeacher);

// Từ chối giáo viên
router.post('/teachers/:id/reject', AdminController.rejectTeacher);

// === QUẢN LÝ HỌC VIÊN ===
// Danh sách thống kê học viên
router.get('/students/stats', AdminController.getStudentStats);

// Chi tiết hồ sơ học viên
router.get('/students/:id/profile', AdminController.getStudentProfile);

// Cập nhật level học viên
router.put('/students/:id/level', AdminController.updateStudentLevel);

// Cập nhật subscription học viên
router.put('/students/:id/subscription', AdminController.updateStudentSubscription);

module.exports = router;
