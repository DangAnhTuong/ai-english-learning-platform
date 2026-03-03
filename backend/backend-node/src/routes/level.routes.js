const express = require('express');
const router = express.Router();
const LevelController = require('../controllers/level.controller');
const RoleGuard = require('../middlewares/role.guard');
const AuthGuard = require('../middlewares/auth.guard');

/**
 * @route   POST /api/v1/levels
 * @desc    Tạo level mới
 * @access  Admin, Teacher
 */
router.post(
    '/',
    AuthGuard.guard,
    RoleGuard.requireRoles(['admin', 'teacher']),
    LevelController.createLevel
);

/**
 * @route   GET /api/v1/levels
 * @desc    Lấy danh sách levels
 * @access  Public
 */
router.get(
    '/',
    LevelController.getLevels
);

/**
 * @route   GET /api/v1/levels/:id
 * @desc    Lấy level theo ID
 * @access  Public
 */
router.get(
    '/:id',
    LevelController.getLevelById
);

/**
 * @route   PUT /api/v1/levels/:id
 * @desc    Cập nhật level
 * @access  Admin, Teacher
 */
router.put(
    '/:id',
    AuthGuard.guard,
    RoleGuard.requireRoles(['admin', 'teacher']),
    LevelController.updateLevel
);

/**
 * @route   DELETE /api/v1/levels/:id
 * @desc    Xóa level (soft delete)
 * @access  Admin, Teacher
 */
router.delete(
    '/:id',
    AuthGuard.guard,
    RoleGuard.requireRoles(['admin', 'teacher']),
    LevelController.deleteLevel
);

/**
 * @route   DELETE /api/v1/levels/:id/permanent
 * @desc    Xóa vĩnh viễn level
 * @access  Admin only
 */
router.delete(
    '/:id/permanent',
    AuthGuard.guard,
    RoleGuard.requireRoles(['admin']),
    LevelController.permanentDeleteLevel
);

module.exports = router;
