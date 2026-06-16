const { Router } = require('express');
const OrderController = require('../controllers/order.controller');
const AuthGuard = require('../middlewares/auth.guard');
const validate = require('../middlewares/validate');
const orderValidation = require('../validations/order.validation');
const { Permissions } = require('../constants/permissions');

const router = Router();

// Webhook nhận thông báo thanh toán từ SePay/Casso (Public Route)
router.post('/webhook/sepay', OrderController.sepayWebhook);

// Tất cả routes bên dưới đều cần authentication
router.use(AuthGuard.guard);

// Tạo đơn hàng (Student, Teacher, Admin)
router.post('/',
    AuthGuard.requirePermissions([Permissions.COURSE_ENROLL]), // Sử dụng permission có sẵn
    validate(orderValidation.createOrder),
    OrderController.createOrder
);

// Lấy danh sách đơn hàng
router.get('/',
    validate(orderValidation.getOrders, 'query'),
    OrderController.getOrders
);

// Lấy thống kê đơn hàng (Admin only)
router.get('/stats',
    AuthGuard.requirePermissions([Permissions.ANALYTICS_VIEW]),
    validate(orderValidation.getOrderStats, 'query'),
    OrderController.getOrderStats
);

// Lấy đơn hàng theo ID
router.get('/:orderId',
    validate(orderValidation.getOrderById, 'params'),
    OrderController.getOrderById
);

// Cập nhật trạng thái đơn hàng (Admin, Teacher)
router.put('/:orderId/status',
    AuthGuard.requirePermissions([Permissions.USER_EDIT]), // Admin/Teacher permission
    validate(orderValidation.updateOrderStatus),
    OrderController.updateOrderStatus
);

// Xác nhận thanh toán (Admin only)
router.post('/:orderId/verify',
    AuthGuard.requirePermissions([Permissions.USER_EDIT]), // Admin permission
    validate(orderValidation.verifyPayment),
    OrderController.verifyPayment
);

module.exports = router;
