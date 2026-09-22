const Order = require('../models/order');
const Subscription = require('../models/subscription');
const User = require('../models/userSchema');
const Course = require('../models/course');
const Enrollment = require('../models/enrollment');
const OrderService = require('../services/order.service');
const AppError = require('../utils/AppError');

// Pricing plans configuration
const PRICING_PLANS = {
  'vip_1_month': {
    id: 'vip_1_month',
    name: 'Gói VIP Cơ Bản (1 Tháng)',
    price: 199000,
    originalPrice: 299000,
    durationDays: 30,
    plan: 'basic',
    features: [
      'Luyện nói & đàm thoại cùng AI không giới hạn',
      'Mở khóa trọn bộ 13 chủ đề và 23+ kịch bản giao tiếp',
      'Chấm điểm phát âm chuẩn bản xứ theo thời gian thực',
      'Tạo sơ đồ tư duy Mindmap từ vựng bằng AI',
      'Truy cập tất cả các khóa học trả phí trên nền tảng'
    ]
  },
  'vip_3_months': {
    id: 'vip_3_months',
    name: 'Gói VIP Tiêu Chuẩn (3 Tháng)',
    price: 499000,
    originalPrice: 699000,
    durationDays: 90,
    popular: true,
    plan: 'premium',
    discountBadge: '🔥 Phổ biến nhất — Tiết kiệm 30%',
    features: [
      'Trọn vẹn quyền lợi gói VIP trong 90 ngày',
      'Luyện hội thoại & Shadowing AI chuyên sâu',
      'Mở khóa toàn bộ khóa học Premium & Business English',
      'Luyện phản xạ thời gian thực qua WebSocket AI',
      'Huy hiệu VIP Gold học viên ưu tú'
    ]
  },
  'vip_12_months': {
    id: 'vip_12_months',
    name: 'Gói VIP Trọn Gói (1 Năm)',
    price: 899000,
    originalPrice: 1499000,
    durationDays: 365,
    plan: 'vip',
    discountBadge: '💎 Siêu tiết kiệm — Giảm 45%',
    features: [
      'Thời hạn sử dụng 365 ngày không giới hạn',
      'Mở khóa toàn bộ các khóa học hiện tại và tương lai',
      'AI Voice Chatbot & Pronunciation Coach riêng biệt',
      'Ưu tiên kết nối máy chủ AI tốc độ cao (0ms latency)',
      'Hỗ trợ kỹ thuật 1-1 và cố vấn lộ trình cá nhân'
    ]
  }
};

// Default Bank Settings (MB Bank of ĐẶNG ANH TƯỜNG - SePay Integrated)
const DEFAULT_BANK = {
  bankId: process.env.BANK_ID || 'MB',
  accountNo: process.env.BANK_ACCOUNT_NO || '0335847674',
  accountName: process.env.BANK_ACCOUNT_NAME || 'DANG ANH TUONG'
};

const PaymentController = {
  /**
   * 1. Lấy danh sách gói cước
   * GET /api/v1/payment/plans
   */
  getPlans: (req, res) => {
    res.json({
      success: true,
      data: Object.values(PRICING_PLANS),
      bankInfo: DEFAULT_BANK
    });
  },

  /**
   * 2. Lấy trạng thái VIP hiện tại của người dùng
   * GET /api/v1/payment/my-status
   */
  getMyStatus: async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      const user = await User.findById(userId).populate('activeSubscriptionId');

      const isVip = Boolean(user?.activeSubscriptionId && user.activeSubscriptionId.status === 'active');
      const subscription = user?.activeSubscriptionId || null;

      // Tìm đơn hàng gần nhất
      const latestOrder = await Order.findOne({ userId }).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: {
          isVip,
          subscription: subscription ? {
            id: subscription._id,
            plan: subscription.plan,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            status: subscription.status
          } : null,
          latestOrder: latestOrder ? {
            orderNumber: latestOrder.orderNumber,
            amount: latestOrder.finalAmount,
            status: latestOrder.status,
            transferContent: latestOrder.transferContent,
            createdAt: latestOrder.createdAt
          } : null
        }
      });
    } catch (error) {
      console.error('getMyStatus error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 3. Tạo đơn hàng thanh toán kèm mã QR VietQR động
   * POST /api/v1/payment/create-order
   */
  createOrder: async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      const { planId, courseId } = req.body;

      let targetPlanId = planId;
      if (planId === 'vip_1m') targetPlanId = 'vip_1_month';
      if (planId === 'vip_3m') targetPlanId = 'vip_3_months';
      if (planId === 'vip_1y') targetPlanId = 'vip_12_months';

      // Nếu có đơn hàng pending của đúng gói hoặc khóa học này trong 15 phút, tái sử dụng
      const queryFilter = {
        userId,
        status: 'pending',
        createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
      };
      if (targetPlanId) {
        queryFilter['metadata.planId'] = targetPlanId;
      }
      if (courseId) {
        queryFilter['metadata.courseId'] = courseId;
      }

      const activePending = await Order.findOne(queryFilter).sort({ createdAt: -1 });

      if (activePending) {
        return res.json({
          success: true,
          isExisting: true,
          message: 'Đơn hàng đang chờ thanh toán',
          data: {
            orderCode: activePending.transferContent || activePending.orderNumber,
            orderId: activePending._id,
            planName: activePending.package.name,
            amount: activePending.finalAmount,
            qrUrl: activePending.metadata?.qrUrl || buildVietQR(activePending.finalAmount, activePending.transferContent),
            bankInfo: DEFAULT_BANK,
            transferContent: activePending.transferContent,
            createdAt: activePending.createdAt
          }
        });
      }

      // Hủy các đơn hàng pending cũ của người dùng nếu họ đổi sang gói khác
      await Order.updateMany(
        { userId, status: 'pending' },
        { $set: { status: 'cancelled' } }
      );

      let packageName = 'Gói VIP Tiêu Chuẩn (3 Tháng)';
      let duration = 90;
      let amount = 499000;
      let planTier = 'premium';

      // Nếu là mua gói VIP
      if (targetPlanId && PRICING_PLANS[targetPlanId]) {
        const p = PRICING_PLANS[targetPlanId];
        packageName = p.name;
        duration = p.durationDays;
        amount = p.price;
        planTier = p.plan;
      } else if (courseId) {
        // Nếu là mua khóa học lẻ
        const course = await Course.findById(courseId);
        if (course) {
          packageName = `Khóa học: ${course.title}`;
          duration = 365;
          amount = course.price || 299000;
          planTier = 'basic';
        }
      }

      // Sinh mã đơn hàng dạng ENGxxxxx (5 số ngẫu nhiên)
      const randomCode = Math.floor(10000 + Math.random() * 90000);
      const orderCode = `ENG${randomCode}`;
      const transferContent = orderCode;

      // Build ảnh VietQR động chuẩn
      const qrUrl = buildVietQR(amount, transferContent);

      // Tạo Order qua OrderService
      const order = await Order.create({
        orderNumber: orderCode,
        userId,
        package: {
          name: packageName,
          duration,
          plan: planTier
        },
        amount,
        finalAmount: amount,
        paymentMethod: 'bank_transfer',
        paymentStatus: 'pending',
        status: 'pending',
        transferContent,
        bankInfo: DEFAULT_BANK,
        metadata: {
          qrUrl,
          courseId: courseId || null,
          planId: targetPlanId || 'vip_3_months'
        }
      });

      res.status(201).json({
        success: true,
        message: 'Tạo đơn hàng thanh toán thành công',
        data: {
          orderCode,
          orderId: order._id,
          planName: packageName,
          amount,
          qrUrl,
          bankInfo: DEFAULT_BANK,
          transferContent,
          createdAt: order.createdAt
        }
      });
    } catch (error) {
      console.error('createOrder error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 4. Kiểm tra trạng thái đơn hàng (Polling từ Frontend)
   * GET /api/v1/payment/check-status/:orderCode
   */
  checkOrderStatus: async (req, res) => {
    try {
      const { orderCode } = req.params;
      const order = await Order.findOne({
        $or: [
          { orderNumber: orderCode },
          { transferContent: orderCode }
        ]
      }).populate('userId', 'name email activeSubscriptionId');

      if (!order) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      }

      const isPaid = order.status === 'paid';
      let subscription = null;
      if (isPaid && order.userId?.activeSubscriptionId) {
        subscription = await Subscription.findById(order.userId.activeSubscriptionId);
      }

      res.json({
        success: true,
        data: {
          orderCode: order.transferContent || order.orderNumber,
          status: order.status,
          isPaid,
          amount: order.finalAmount,
          planName: order.package.name,
          paidAt: order.verifiedAt || null,
          isVip: isPaid,
          subscription: subscription ? {
            plan: subscription.plan,
            endDate: subscription.endDate
          } : null
        }
      });
    } catch (error) {
      console.error('checkOrderStatus error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 5. Webhook nhận biến động số dư từ SePay
   * POST /api/v1/payment/webhook
   */
  handleWebhook: async (req, res) => {
    try {
      const payload = req.body || {};
      const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'tuong_tan_toeic_sepay_webhook_secret_2026';

      const content = payload.content ||
        payload.description ||
        payload.transactionContent ||
        payload.body ||
        payload.orderCode ||
        payload.code ||
        '';

      const amount = Number(
        payload.transferAmount ||
        payload.amount ||
        payload.amountIn ||
        payload.amount_in ||
        0
      );

      const incomingAccount = (payload.accountNumber || payload.account_number || payload.subAccount || '').toString().trim();
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || '';

      console.log('⚡ [ENGLISH SEPAY WEBHOOK RECEIVED]:', {
        content,
        amount,
        clientIp,
        incomingAccount
      });

      // Trích xuất mã đơn hàng: ENG + 5 chữ số (e.g. ENG12345)
      const match = content.match(/ENG\d{5}/i) || content.match(/ORD\w+/i);
      const orderCode = match ? match[0].toUpperCase() : null;

      // Kiểm tra xác thực (Secret header, IP hoặc tài khoản MBBank 0335847674)
      const incomingSecret = req.headers['x-api-key'] ||
        req.headers['authorization'] ||
        req.headers['x-sepay-key'] ||
        req.query?.secret ||
        payload.secret;

      const matchesSecret = incomingSecret && (
        incomingSecret === webhookSecret ||
        incomingSecret === `Bearer ${webhookSecret}` ||
        incomingSecret === `Apikey ${webhookSecret}` ||
        incomingSecret.toString().trim() === webhookSecret.trim()
      );

      const matchesAccount = incomingAccount === DEFAULT_BANK.accountNo || incomingAccount === '0335847674';

      let pendingOrder = null;
      if (orderCode) {
        pendingOrder = await Order.findOne({
          $or: [
            { transferContent: orderCode },
            { orderNumber: orderCode }
          ]
        });
      }

      const isAuthorized = matchesSecret || matchesAccount || Boolean(pendingOrder);

      if (!isAuthorized) {
        console.warn(`[SECURITY ALERT] Unauthorized payment webhook from ${clientIp}`);
        return res.status(401).json({ success: false, message: 'Unauthorized webhook' });
      }

      if (!orderCode) {
        return res.status(200).json({ success: false, message: 'No matching ENG order code found in content.' });
      }

      const order = pendingOrder || await Order.findOne({
        $or: [
          { transferContent: orderCode },
          { orderNumber: orderCode }
        ]
      });

      if (!order) {
        return res.status(404).json({ success: false, message: `Order not found for code: ${orderCode}` });
      }

      // Idempotency: Nếu đơn đã thanh toán rồi, bỏ qua
      if (order.status === 'paid') {
        return res.status(200).json({ success: true, message: 'Order was already processed.' });
      }

      // Kiểm tra số tiền chuyển phải >= giá trị đơn hàng
      if (amount > 0 && amount < order.finalAmount) {
        console.warn(`Amount mismatch: transferred ${amount}, required ${order.finalAmount}`);
        return res.status(400).json({ success: false, message: 'Amount is less than required.' });
      }

      // Kích hoạt thanh toán và tự động lên VIP qua OrderService
      await OrderService.updateOrderStatus(order._id, 'paid', null);

      // Nếu đơn hàng có kèm courseId, tự động ghi danh khóa học đó
      if (order.metadata?.courseId) {
        try {
          const courseId = order.metadata.courseId;
          const existing = await Enrollment.findOne({ userId: order.userId, courseId });
          if (!existing) {
            const course = await Course.findById(courseId);
            await Enrollment.create({
              userId: order.userId,
              courseId,
              progress: {
                totalLessons: course?.totalLessons || 0,
                totalModules: course?.modules?.length || 0
              }
            });
            await Course.findByIdAndUpdate(courseId, { $inc: { enrolledStudents: 1 } });
          }
        } catch (e) {
          console.error('Auto-enroll course error:', e);
        }
      }

      console.log(`🎉 [SEPAY ACTIVATION SUCCESS]: User ${order.userId} upgraded to ${order.package.name} via ${orderCode}`);

      return res.status(200).json({
        success: true,
        message: `Kích hoạt VIP thành công cho đơn hàng ${orderCode}!`,
        data: { orderCode, isVip: true }
      });
    } catch (error) {
      console.error('handleWebhook error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 6. Giả lập thanh toán thành công (Dành cho Demo / Nhà tuyển dụng test ngay)
   * POST /api/v1/payment/simulate/:orderCode
   */
  simulatePayment: async (req, res) => {
    try {
      const { orderCode } = req.params;
      const order = await Order.findOne({
        $or: [
          { orderNumber: orderCode },
          { transferContent: orderCode }
        ]
      });

      if (!order) {
        return res.status(404).json({ success: false, message: `Không tìm thấy đơn hàng ${orderCode}` });
      }

      if (order.status === 'paid') {
        return res.json({ success: true, message: 'Đơn hàng đã thanh toán từ trước' });
      }

      // Kích hoạt VIP tức thì
      await OrderService.updateOrderStatus(order._id, 'paid', null);

      // Tự động enroll nếu có courseId
      if (order.metadata?.courseId) {
        try {
          const courseId = order.metadata.courseId;
          const existing = await Enrollment.findOne({ userId: order.userId, courseId });
          if (!existing) {
            const course = await Course.findById(courseId);
            await Enrollment.create({
              userId: order.userId,
              courseId,
              progress: {
                totalLessons: course?.totalLessons || 0,
                totalModules: course?.modules?.length || 0
              }
            });
            await Course.findByIdAndUpdate(courseId, { $inc: { enrolledStudents: 1 } });
          }
        } catch (e) {
          console.error('Auto-enroll demo error:', e);
        }
      }

      res.json({
        success: true,
        message: `[DEMO TEST] Đã kích hoạt thành công gói ${order.package.name}!`,
        data: { orderCode, isVip: true }
      });
    } catch (error) {
      console.error('simulatePayment error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// Helper tạo VietQR URL chuẩn
function buildVietQR(amount, content) {
  const bankId = DEFAULT_BANK.bankId;
  const accountNo = DEFAULT_BANK.accountNo;
  const accountName = encodeURIComponent(DEFAULT_BANK.accountName);
  const addInfo = encodeURIComponent(content);
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
}

module.exports = PaymentController;
