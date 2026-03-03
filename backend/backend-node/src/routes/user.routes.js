const { Router } = require('express');
const UserController = require('../controllers/user.controller');
const AuthGuard = require('../middlewares/auth.guard');
const validate = require('../middlewares/validate');
const userValidation = require('../validations/user.validation');
const { Permissions } = require('../constants/permissions');

const router = Router();

// Tất cả routes đều yêu cầu authentication và admin permissions
router.use(AuthGuard.guard);

// Lấy user statistics
router.get('/stats',
    AuthGuard.requirePermissions([Permissions.ANALYTICS_VIEW]),
    UserController.getUserStats
);

// Lấy danh sách users
router.get('/',
    AuthGuard.requirePermissions([Permissions.USER_VIEW]),
    validate(userValidation.getUsers, 'query'),
    UserController.getUsers
);

// Lấy user theo ID
router.get('/:userId',
    AuthGuard.requirePermissions([Permissions.USER_VIEW]),
    validate(userValidation.getUserById, 'params'),
    UserController.getUserById
);

// Tạo user mới
router.post('/',
    AuthGuard.requirePermissions([Permissions.USER_CREATE]),
    validate(userValidation.createUser),
    UserController.createUser
);

// Cập nhật user
router.put('/:userId',
    AuthGuard.requirePermissions([Permissions.USER_EDIT]),
    validate(userValidation.updateUser, 'params'),
    validate(userValidation.updateUser, 'body'),
    UserController.updateUser
);

// Xóa user
router.delete('/:userId',
    AuthGuard.requirePermissions([Permissions.USER_DELETE]),
    validate(userValidation.deleteUser, 'params'),
    UserController.deleteUser
);

// Ban user
router.post('/:userId/ban',
    AuthGuard.requirePermissions([Permissions.USER_BAN]),
    validate(userValidation.banUser, 'params'),
    UserController.banUser
);

// Unban user
router.post('/:userId/unban',
    AuthGuard.requirePermissions([Permissions.USER_UNBAN]),
    validate(userValidation.unbanUser, 'params'),
    UserController.unbanUser
);

// Cập nhật roles
router.put('/:userId/roles',
    AuthGuard.requirePermissions([Permissions.USER_EDIT]),
    validate(userValidation.updateUserRoles, 'params'),
    validate(userValidation.updateUserRoles, 'body'),
    UserController.updateUserRoles
);

module.exports = router;
