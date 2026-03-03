const Subscription = require('../models/subscription');
const User = require('../models/userSchema');
const AppError = require('../utils/AppError');

const SubscriptionService = {
    /**
     * Tạo subscription mới
     * @param {Object} subscriptionData - Dữ liệu subscription
     * @param {String} userId - ID người dùng
     * @returns {Promise<Object>} Subscription object
     */
    async createSubscription(subscriptionData, userId) {
        const {
            plan,
            duration, // in days
            paymentMethod,
            autoRenew = false
        } = subscriptionData;

        // Validate user exists
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration);

        // Create subscription
        const subscription = new Subscription({
            userId,
            plan,
            startDate,
            endDate,
            autoRenew,
            paymentMethod,
            status: 'active'
        });

        await subscription.save();

        // Update user's active subscription
        user.activeSubscriptionId = subscription._id;
        await user.save();

        await subscription.populate('userId', 'name email phone');

        return subscription;
    },

    /**
     * Lấy subscription hiện tại của user
     * @param {String} userId - User ID
     * @returns {Promise<Object|null>} Active subscription or null
     */
    async getActiveSubscription(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        if (user.activeSubscriptionId) {
            const subscription = await Subscription.findById(user.activeSubscriptionId)
                .populate('userId', 'name email phone');
            
            // Check if subscription is still active
            if (subscription && subscription.status === 'active') {
                // Check if expired
                if (subscription.endDate && new Date() > subscription.endDate) {
                    subscription.status = 'expired';
                    await subscription.save();
                    return null;
                }
                return subscription;
            }
        }

        // Try to find any active subscription
        const subscription = await Subscription.findOne({
            userId,
            status: 'active'
        })
        .sort({ createdAt: -1 })
        .populate('userId', 'name email phone');

        if (subscription) {
            // Check if expired
            if (subscription.endDate && new Date() > subscription.endDate) {
                subscription.status = 'expired';
                await subscription.save();
                return null;
            }
            
            // Update user's active subscription
            user.activeSubscriptionId = subscription._id;
            await user.save();
            
            return subscription;
        }

        return null;
    },

    /**
     * Lấy lịch sử subscription của user
     * @param {String} userId - User ID
     * @returns {Promise<Array>} List of subscriptions
     */
    async getSubscriptionHistory(userId) {
        const subscriptions = await Subscription.find({ userId })
            .sort({ createdAt: -1 })
            .populate('userId', 'name email phone');

        return subscriptions;
    },

    /**
     * Hủy subscription
     * @param {String} subscriptionId - Subscription ID
     * @param {String} userId - User ID (for permission check)
     * @returns {Promise<Object>} Updated subscription
     */
    async cancelSubscription(subscriptionId, userId) {
        const subscription = await Subscription.findById(subscriptionId);

        if (!subscription) {
            throw new AppError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
        }

        // Permission check: User can only cancel their own subscription
        if (subscription.userId.toString() !== userId.toString()) {
            throw new AppError('Access denied', 403, 'ACCESS_DENIED');
        }

        if (subscription.status !== 'active') {
            throw new AppError(`Subscription is already ${subscription.status}`, 400, 'SUBSCRIPTION_NOT_ACTIVE');
        }

        subscription.status = 'cancelled';
        subscription.autoRenew = false;
        await subscription.save();

        // Update user's active subscription if this was the active one
        const user = await User.findById(userId);
        if (user && user.activeSubscriptionId && user.activeSubscriptionId.toString() === subscriptionId) {
            user.activeSubscriptionId = null;
            await user.save();
        }

        await subscription.populate('userId', 'name email phone');

        return subscription;
    },

    /**
     * Gia hạn subscription
     * @param {String} subscriptionId - Subscription ID
     * @param {Number} additionalDays - Số ngày thêm vào
     * @returns {Promise<Object>} Updated subscription
     */
    async extendSubscription(subscriptionId, additionalDays) {
        const subscription = await Subscription.findById(subscriptionId);

        if (!subscription) {
            throw new AppError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
        }

        if (subscription.status !== 'active') {
            throw new AppError(`Cannot extend ${subscription.status} subscription`, 400, 'SUBSCRIPTION_NOT_ACTIVE');
        }

        // Extend end date
        const currentEndDate = subscription.endDate || new Date();
        const newEndDate = new Date(currentEndDate);
        newEndDate.setDate(newEndDate.getDate() + additionalDays);

        subscription.endDate = newEndDate;
        subscription.status = 'active';
        await subscription.save();

        await subscription.populate('userId', 'name email phone');

        return subscription;
    }
};

module.exports = SubscriptionService;
