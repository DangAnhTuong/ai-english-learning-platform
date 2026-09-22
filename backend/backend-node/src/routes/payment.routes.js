const { Router } = require('express');
const PaymentController = require('../controllers/payment.controller');
const AuthGuard = require('../middlewares/auth.guard');

const router = Router();

// 1. Lấy danh sách gói cước VIP (Public)
router.get('/plans', PaymentController.getPlans);

// 2. Tra cứu trạng thái đơn hàng (Polling realtime - Public để frontend poll không bị token expire chặn)
router.get('/check-status/:orderCode', PaymentController.checkOrderStatus);

// 3. Webhook SePay nhận thông báo ngân hàng tự động (Public có multi-layer auth check)
router.post('/webhook', PaymentController.handleWebhook);

// 4. Giả lập thanh toán tức thì (Dành cho Demo / Tuyển dụng test)
router.post('/simulate/:orderCode', PaymentController.simulatePayment);

// 5. Kiểm tra trạng thái VIP của bản thân (Yêu cầu đăng nhập)
router.get('/my-status', AuthGuard.guard, PaymentController.getMyStatus);

// 6. Tạo đơn hàng thanh toán VietQR (Yêu cầu đăng nhập)
router.post('/create-order', AuthGuard.guard, PaymentController.createOrder);

module.exports = router;
