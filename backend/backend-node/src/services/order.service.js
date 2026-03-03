const Order = require('../models/order');
const Subscription = require('../models/subscription');
const User = require('../models/userSchema');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

const OrderService = {
    /**
     * Tạo đơn hàng mới
     * @param {Object} orderData - Dữ liệu đơn hàng
     * @param {String} userId - ID người dùng
     * @returns {Promise<Object>} Order object
     */
    async createOrder(orderData, userId) {
        const {
            package: packageData,
            amount,
            currency = 'VND',
            discount = 0,
            paymentMethod = 'bank_transfer',
            transferContent,
            bankInfo,
            notes,
            metadata
        } = orderData;

        // Validate user exists
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        // Calculate final amount
        const finalAmount = Math.max(0, amount - discount);

        // Generate unique order number
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        let orderNumber = `ORD${timestamp}${random}`;
        
        // Ensure uniqueness (check and retry if needed)
        let exists = await Order.findOne({ orderNumber });
        let retries = 0;
        while (exists && retries < 5) {
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            orderNumber = `ORD${timestamp}${random}`;
            exists = await Order.findOne({ orderNumber });
            retries++;
        }

        // Create order
        const order = new Order({
            orderNumber,
            userId,
            package: {
                name: packageData.name,
                duration: packageData.duration,
                plan: packageData.plan || 'basic'
            },
            amount,
            currency,
            discount,
            finalAmount,
            paymentMethod,
            transferContent,
            bankInfo,
            notes,
            metadata,
            status: 'pending',
            paymentStatus: 'pending'
        });

        await order.save();
        await order.populate('userId', 'name email phone');

        return order;
    },

    /**
     * Lấy danh sách đơn hàng
     * @param {Object} filters - Filters (userId, status, paymentStatus, dateRange)
     * @param {Object} pagination - Pagination (page, limit, sortBy, sortOrder)
     * @param {String} requesterId - ID người yêu cầu (để check permissions)
     * @param {Array} requesterRoles - Roles của người yêu cầu
     * @returns {Promise<Object>} { orders, pagination }
     */
    async getOrders(filters = {}, pagination = {}, requesterId, requesterRoles = []) {
        const {
            userId,
            status,
            paymentStatus,
            dateFrom,
            dateTo,
            search
        } = filters;

        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = pagination;

        // Build query
        const query = {};

        // Permission check: Student chỉ xem được orders của mình
        if (requesterRoles.includes('student') && !requesterRoles.includes('admin') && !requesterRoles.includes('teacher')) {
            query.userId = requesterId;
        } else if (userId) {
            query.userId = userId;
        }

        if (status) {
            query.status = status;
        }

        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        // Date range filter
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) {
                query.createdAt.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                query.createdAt.$lte = new Date(dateTo);
            }
        }

        // Search by order number or transaction ID
        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { transactionId: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        // Execute query
        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate('userId', 'name email phone')
                .populate('verifiedBy', 'name email')
                .populate('subscriptionId')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(query)
        ]);

        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    },

    /**
     * Lấy đơn hàng theo ID
     * @param {String} orderId - Order ID
     * @param {String} requesterId - ID người yêu cầu
     * @param {Array} requesterRoles - Roles của người yêu cầu
     * @returns {Promise<Object>} Order object
     */
    async getOrderById(orderId, requesterId, requesterRoles = []) {
        const order = await Order.findById(orderId)
            .populate('userId', 'name email phone')
            .populate('verifiedBy', 'name email')
            .populate('subscriptionId');

        if (!order) {
            throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
        }

        // Permission check: Student chỉ xem được orders của mình
        if (requesterRoles.includes('student') && !requesterRoles.includes('admin') && !requesterRoles.includes('teacher')) {
            const orderUserId = order.userId._id ? order.userId._id.toString() : order.userId.toString();
            if (orderUserId !== requesterId.toString()) {
                throw new AppError('Access denied', 403, 'ACCESS_DENIED');
            }
        }

        return order;
    },

    /**
     * Cập nhật trạng thái đơn hàng
     * @param {String} orderId - Order ID
     * @param {String} status - New status
     * @param {String} verifiedBy - Admin/Teacher ID who verified
     * @returns {Promise<Object>} Updated order
     */
    async updateOrderStatus(orderId, status, verifiedBy) {
        const order = await Order.findById(orderId);

        if (!order) {
            throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
        }

        // Validate status transition
        const validTransitions = {
            'pending': ['paid', 'failed', 'cancelled'],
            'paid': ['refunded'],
            'failed': [],
            'cancelled': []
        };

        if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
            throw new AppError(`Cannot change status from ${order.status} to ${status}`, 400, 'INVALID_STATUS_TRANSITION');
        }

        // Update status
        if (status === 'paid') {
            await order.markAsPaid(verifiedBy);
            
            // Create or update subscription
            await this.createSubscriptionFromOrder(order);
        } else if (status === 'failed') {
            await order.markAsFailed();
        } else if (status === 'cancelled') {
            await order.cancel();
        } else {
            order.status = status;
            order.paymentStatus = status === 'refunded' ? 'refunded' : order.paymentStatus;
            await order.save();
        }

        await order.populate('userId', 'name email phone');
        await order.populate('subscriptionId');

        return order;
    },

    /**
     * Xác nhận thanh toán (Admin)
     * @param {String} orderId - Order ID
     * @param {String} transactionId - Transaction ID
     * @param {String} verifiedBy - Admin ID
     * @returns {Promise<Object>} Updated order
     */
    async verifyPayment(orderId, transactionId, verifiedBy) {
        const order = await Order.findById(orderId);

        if (!order) {
            throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
        }

        if (order.status !== 'pending') {
            throw new AppError(`Order is already ${order.status}`, 400, 'ORDER_ALREADY_PROCESSED');
        }

        // Update transaction ID
        if (transactionId) {
            order.transactionId = transactionId;
        }

        // Mark as paid
        await order.markAsPaid(verifiedBy);

        // Create subscription
        await this.createSubscriptionFromOrder(order);

        await order.populate('userId', 'name email phone');
        await order.populate('subscriptionId');

        return order;
    },

    /**
     * Tạo subscription từ order
     * @param {Object} order - Order object
     * @returns {Promise<Object>} Subscription object
     */
    async createSubscriptionFromOrder(order) {
        // Get userId (handle both ObjectId and populated object)
        const userId = order.userId._id ? order.userId._id : order.userId;

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + order.package.duration);

        // Check if user has active subscription
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        let subscription = null;

        if (user.activeSubscriptionId) {
            subscription = await Subscription.findById(user.activeSubscriptionId);
            if (subscription && subscription.status === 'active') {
                // Check if expired
                if (subscription.endDate && new Date() > subscription.endDate) {
                    subscription.status = 'expired';
                    await subscription.save();
                    subscription = null; // Will create new one
                } else {
                    // Extend existing active subscription
                    const currentEndDate = subscription.endDate || new Date();
                    const newEndDate = new Date(Math.max(currentEndDate.getTime(), startDate.getTime()));
                    newEndDate.setDate(newEndDate.getDate() + order.package.duration);
                    
                    subscription.endDate = newEndDate;
                    subscription.status = 'active';
                    
                    // Add to billing history
                    if (!subscription.billingHistory) {
                        subscription.billingHistory = [];
                    }
                    subscription.billingHistory.push({
                        amount: order.finalAmount,
                        currency: order.currency,
                        date: startDate,
                        status: 'completed',
                        transactionId: order.transactionId || order.orderNumber
                    });
                    
                    await subscription.save();
                }
            }
        }

        // If no active subscription, create new one
        if (!subscription || subscription.status !== 'active') {
            subscription = new Subscription({
                userId: userId,
                plan: order.package.plan,
                startDate: startDate,
                endDate: endDate,
                status: 'active',
                paymentMethod: order.paymentMethod,
                billingHistory: [{
                    amount: order.finalAmount,
                    currency: order.currency,
                    date: startDate,
                    status: 'completed',
                    transactionId: order.transactionId || order.orderNumber
                }]
            });
            await subscription.save();
        }

        // Link subscription to order
        order.subscriptionId = subscription._id;
        await order.save();

        // Update user's active subscription
        user.activeSubscriptionId = subscription._id;
        await user.save();

        return subscription;
    },

    /**
     * Lấy thống kê đơn hàng
     * @param {Object} filters - Filters (dateFrom, dateTo)
     * @returns {Promise<Object>} Statistics
     */
    async getOrderStats(filters = {}) {
        const { dateFrom, dateTo } = filters;

        const query = { status: 'paid' };
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) {
                query.createdAt.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                query.createdAt.$lte = new Date(dateTo);
            }
        }

        const stats = await Order.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$finalAmount' },
                    totalOrders: { $sum: 1 },
                    averageOrderValue: { $avg: '$finalAmount' }
                }
            }
        ]);

        const statusCounts = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            totalRevenue: stats[0]?.totalRevenue || 0,
            totalOrders: stats[0]?.totalOrders || 0,
            averageOrderValue: stats[0]?.averageOrderValue || 0,
            statusCounts: statusCounts.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {})
        };
    }
};

module.exports = OrderService;
