const { Router } = require('express');
const ProfileController = require('../controllers/profile.controller');
const AuthGuard = require('../middlewares/auth.guard');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = Router();

// Cấu hình multer cho upload avatar
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
        // Tạo thư mục nếu chưa có
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Tạo tên file unique: userId_timestamp.extension
        const ext = path.extname(file.originalname);
        const filename = `${req.user.id}_${Date.now()}${ext}`;
        cb(null, filename);
    }
});

const avatarFilter = (req, file, cb) => {
    // Chỉ chấp nhận file ảnh
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, gif, webp)'), false);
    }
};

const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: avatarFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

// Tất cả routes đều yêu cầu authentication
router.use(AuthGuard.guard);

/**
 * @route GET /api/v1/profile
 * @desc Lấy thông tin profile đầy đủ
 * @access Private
 */
router.get('/', ProfileController.getFullProfile);

/**
 * @route PUT /api/v1/profile
 * @desc Cập nhật thông tin cá nhân
 * @access Private
 */
router.put('/', ProfileController.updateProfile);

/**
 * @route POST /api/v1/profile/avatar
 * @desc Upload ảnh đại diện
 * @access Private
 */
router.post('/avatar', uploadAvatar.single('avatar'), ProfileController.uploadAvatar);

/**
 * @route PUT /api/v1/profile/learning
 * @desc Cập nhật learning profile
 * @access Private
 */
router.put('/learning', ProfileController.updateLearningProfile);

/**
 * @route GET /api/v1/profile/progress
 * @desc Lấy tiến độ học tập
 * @access Private
 */
router.get('/progress', ProfileController.getLearningProgress);

/**
 * @route GET /api/v1/profile/history
 * @desc Lấy lịch sử học tập
 * @access Private
 */
router.get('/history', ProfileController.getLearningHistory);

/**
 * @route POST /api/v1/profile/change-password
 * @desc Đổi mật khẩu
 * @access Private
 */
router.post('/change-password', ProfileController.changePassword);

/**
 * @route POST /api/v1/profile/set-password
 * @desc Đặt mật khẩu cho tài khoản Google
 * @access Private
 */
router.post('/set-password', ProfileController.setPassword);

/**
 * @route GET /api/v1/profile/has-password
 * @desc Kiểm tra xem tài khoản có mật khẩu không
 * @access Private
 */
router.get('/has-password', ProfileController.hasPassword);

module.exports = router;
