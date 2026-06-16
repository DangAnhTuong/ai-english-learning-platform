const OrderService = require('../services/order.service');
const Order = require('../models/order');
const AppError = require('../utils/AppError');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const OrderController = {
    /**
     * Tạo đơn hàng mới
     * POST /api/v1/orders
     */
    createOrder: asyncHandler(async (req, res) => {
        const order = await OrderService.createOrder(req.body, req.user.id);
        
        res.status(201).json({
            success: true,
            message: 'Tạo đơn hàng thành công',
            data: { order }
        });
    }),

    /**
     * Lấy danh sách đơn hàng
     * GET /api/v1/orders
     */
    getOrders: asyncHandler(async (req, res) => {
        const filters = {
            userId: req.query.userId,
            status: req.query.status,
            paymentStatus: req.query.paymentStatus,
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo,
            search: req.query.search
        };

        const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            sortBy: req.query.sortBy || 'createdAt',
            sortOrder: req.query.sortOrder || 'desc'
        };

        const result = await OrderService.getOrders(
            filters,
            pagination,
            req.user.id,
            req.user.roles
        );

        res.json({
            success: true,
            data: result.orders,
            pagination: result.pagination
        });
    }),

    /**
     * Lấy đơn hàng theo ID
     * GET /api/v1/orders/:orderId
     */
    getOrderById: asyncHandler(async (req, res) => {
        const { orderId } = req.params;
        const order = await OrderService.getOrderById(
            orderId,
            req.user.id,
            req.user.roles
        );

        res.json({
            success: true,
            data: { order }
        });
    }),

    /**
     * Cập nhật trạng thái đơn hàng
     * PUT /api/v1/orders/:orderId/status
     */
    updateOrderStatus: asyncHandler(async (req, res) => {
        const { orderId } = req.params;
        const { status, transactionId } = req.body;

        if (!status) {
            throw new AppError('Status is required', 400, 'STATUS_REQUIRED');
        }

        const verifiedBy = req.user.roles.includes('admin') || req.user.roles.includes('teacher')
            ? req.user.id
            : null;

        // If transactionId provided, update it before status change
        if (transactionId) {
            const orderBeforeUpdate = await Order.findById(orderId);
            if (orderBeforeUpdate) {
                orderBeforeUpdate.transactionId = transactionId;
                await orderBeforeUpdate.save();
            }
        }

        const order = await OrderService.updateOrderStatus(orderId, status, verifiedBy);

        res.json({
            success: true,
            message: 'Cập nhật trạng thái đơn hàng thành công',
            data: { order }
        });
    }),

    /**
     * Xác nhận thanh toán (Admin)
     * POST /api/v1/orders/:orderId/verify
     */
    verifyPayment: asyncHandler(async (req, res) => {
        const { orderId } = req.params;
        const { transactionId } = req.body;

        const order = await OrderService.verifyPayment(
            orderId,
            transactionId,
            req.user.id
        );

        res.json({
            success: true,
            message: 'Xác nhận thanh toán thành công',
            data: { order }
        });
    }),

    /**
     * Lấy thống kê đơn hàng (Admin)
     * GET /api/v1/orders/stats
     */
    getOrderStats: asyncHandler(async (req, res) => {
        const filters = {
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo
        };

        const stats = await OrderService.getOrderStats(filters);

        res.json({
            success: true,
            data: stats
        });
    }),

    /**
     * Webhook nhận dữ liệu từ SePay/Casso (Tự động hóa thanh toán)
     * POST /api/v1/orders/webhook/sepay
     */
    sepayWebhook: asyncHandler(async (req, res) => {
        const payload = req.body;
        // Dữ liệu mẫu từ SePay: { gateway: "SePay", transactionDate: "...", accountNo: "...", transferAmount: 100000, transferContent: "DH123456", referenceCode: "ABC" }
        // Ta cần trích xuất mã đơn hàng từ transferContent
        const content = payload.content || payload.transferContent || '';
        const amount = payload.transferAmount || payload.amount || 0;
        const transactionId = payload.referenceCode || payload.transaction_id || 'AUTO_WEBHOOK';

        if (!content || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid payload' });
        }

        // Tìm kiếm tất cả các Order đang pending
        const pendingOrders = await Order.find({ status: 'pending' });

        let matchedOrder = null;
        for (let order of pendingOrders) {
            // Kiểm tra xem content chuyển khoản có chứa mã đơn hàng không
            // Mã đơn hàng của chúng ta thường là orderCode hoặc order._id
            const codeToMatch = order.orderCode ? order.orderCode.toUpperCase() : order._id.toString().toUpperCase().slice(-6);
            if (content.toUpperCase().includes(codeToMatch)) {
                matchedOrder = order;
                break;
            }
        }

        if (matchedOrder) {
            // Nếu tìm thấy và số tiền chuyển >= số tiền đơn hàng
            if (amount >= matchedOrder.totalAmount) {
                // Tự động xác nhận đơn hàng
                await OrderService.verifyPayment(matchedOrder._id, transactionId, null); // verifiedBy = null (AUTO)
                return res.json({ success: true, message: 'Order auto-verified' });
            } else {
                return res.json({ success: false, message: 'Amount not matched' });
            }
        }

        res.json({ success: false, message: 'Order not found' });
    })
};

module.exports = OrderController;
