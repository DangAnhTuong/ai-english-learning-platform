const { Router } = require('express');
const SubscriptionController = require('../controllers/subscription.controller');
const AuthGuard = require('../middlewares/auth.guard');
const validate = require('../middlewares/validate');
const subscriptionValidation = require('../validations/subscription.validation');
const { Permissions } = require('../constants/permissions');

const router = Router();

// Public routes (không cần auth)
router.get('/plans',
    validate(subscriptionValidation.planQuery, 'query'),
    SubscriptionController.getPlans
);

// Tất cả routes bên dưới đều cần authentication
router.use(AuthGuard.guard);

// Tạo subscription (Student, Teacher, Admin)
router.post('/',
    AuthGuard.requirePermissions([Permissions.COURSE_ENROLL]),
    validate(subscriptionValidation.createSubscription),
    SubscriptionController.createSubscription
);

// Lấy subscription hiện tại
router.get('/active',
    SubscriptionController.getActiveSubscription
);

// Lấy lịch sử subscription
router.get('/history',
    SubscriptionController.getSubscriptionHistory
);

// Hủy subscription
router.put('/:id/cancel',
    validate(subscriptionValidation.cancelSubscription, 'params'),
    SubscriptionController.cancelSubscription
);

// Gia hạn subscription (Admin only)
router.put('/:id/extend',
    AuthGuard.requirePermissions([Permissions.USER_EDIT]),
    validate(subscriptionValidation.extendSubscription),
    SubscriptionController.extendSubscription
);

// Plan CRUD (Admin/Teacher for content management)
router.post('/plans',
    AuthGuard.requireRoles(['admin', 'teacher']),
    validate(subscriptionValidation.createPlan),
    SubscriptionController.createPlan
);

router.put('/plans/:id',
    AuthGuard.requireRoles(['admin', 'teacher']),
    validate(subscriptionValidation.planId, 'params'),
    validate(subscriptionValidation.updatePlan),
    SubscriptionController.updatePlan
);

router.delete('/plans/:id',
    AuthGuard.requireRoles(['admin', 'teacher']),
    validate(subscriptionValidation.planId, 'params'),
    SubscriptionController.deletePlan
);

module.exports = router;
