const SubscriptionService = require('../services/subscription.service');
const AppError = require('../utils/AppError');
const SubscriptionPlan = require('../models/subscriptionPlan');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const SubscriptionController = {
    seedDefaultPlans: async () => {
        const defaults = [
            {
                code: 'BASIC_MONTHLY',
                name: 'Co ban',
                type: 'basic',
                price: 199000,
                currency: 'VND',
                duration: 30,
                durationLabel: '1 thang',
                features: ['Truy cap moi bai hoc', 'Luyen noi AI co ban', 'Tra tu dien Mindmap'],
                discount: null,
                isPopular: false,
                color: '#597ef7',
                order: 1,
                isActive: true
            },
            {
                code: 'PREMIUM_QUARTERLY',
                name: 'Tieu chuan',
                type: 'premium',
                price: 499000,
                currency: 'VND',
                duration: 90,
                durationLabel: '3 thang',
                features: ['Tat ca tinh nang Co ban', 'Luyen noi khong gioi han', 'Khong quang cao', 'Tiet kiem 20%'],
                discount: 20,
                isPopular: true,
                color: '#13c2c2',
                order: 2,
                isActive: true
            },
            {
                code: 'VIP_HALF_YEAR',
                name: 'Cao cap',
                type: 'vip',
                price: 899000,
                currency: 'VND',
                duration: 180,
                durationLabel: '6 thang',
                features: ['Full tinh nang Tieu chuan', 'Chung chi hoan thanh', 'Ho tro 1-1 uu tien', 'Tiet kiem 40%'],
                discount: 40,
                isPopular: false,
                color: '#faad14',
                order: 3,
                isActive: true
            }
        ];

        await SubscriptionPlan.insertMany(defaults, { ordered: false });
    },

    mapPlan: (plan) => ({
        id: plan._id.toString(),
        code: plan.code,
        name: plan.name,
        type: plan.type,
        price: plan.price,
        currency: plan.currency,
        duration: plan.duration,
        durationLabel: plan.durationLabel,
        features: plan.features || [],
        discount: plan.discount,
        isPopular: plan.isPopular,
        color: plan.color,
        order: plan.order,
        isActive: plan.isActive,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
    }),

    /**
     * Lấy danh sách gói cước (public)
     * GET /api/v1/subscriptions/plans
     */
    getPlans: asyncHandler(async (req, res) => {
        const includeInactive = req.query.includeInactive === true || req.query.includeInactive === 'true';
        let query = {};
        if (!includeInactive) {
            query = { isActive: true };
        }

        let plans = await SubscriptionPlan.find(query).sort({ order: 1, createdAt: 1 });
        if (plans.length === 0 && !includeInactive) {
            await SubscriptionController.seedDefaultPlans().catch(() => null);
            plans = await SubscriptionPlan.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
        }

        res.json({
            success: true,
            data: plans.map(SubscriptionController.mapPlan)
        });
    }),

    createPlan: asyncHandler(async (req, res) => {
        const payload = { ...req.body };
        if (payload.code) payload.code = payload.code.toUpperCase().trim();

        const existing = await SubscriptionPlan.findOne({ code: payload.code });
        if (existing) {
            throw new AppError('Ma goi hoc da ton tai', 400, 'PLAN_CODE_EXISTS');
        }

        const plan = await SubscriptionPlan.create(payload);
        res.status(201).json({
            success: true,
            message: 'Tao goi hoc thanh cong',
            data: SubscriptionController.mapPlan(plan)
        });
    }),

    updatePlan: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const payload = { ...req.body };
        if (payload.code) payload.code = payload.code.toUpperCase().trim();

        const plan = await SubscriptionPlan.findById(id);
        if (!plan) {
            throw new AppError('Khong tim thay goi hoc', 404, 'PLAN_NOT_FOUND');
        }

        if (payload.code && payload.code !== plan.code) {
            const existing = await SubscriptionPlan.findOne({ code: payload.code, _id: { $ne: id } });
            if (existing) {
                throw new AppError('Ma goi hoc da ton tai', 400, 'PLAN_CODE_EXISTS');
            }
        }

        Object.assign(plan, payload);
        await plan.save();

        res.json({
            success: true,
            message: 'Cap nhat goi hoc thanh cong',
            data: SubscriptionController.mapPlan(plan)
        });
    }),

    deletePlan: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const plan = await SubscriptionPlan.findById(id);
        if (!plan) {
            throw new AppError('Khong tim thay goi hoc', 404, 'PLAN_NOT_FOUND');
        }
        plan.isActive = false;
        await plan.save();

        res.json({
            success: true,
            message: 'An goi hoc thanh cong',
            data: SubscriptionController.mapPlan(plan)
        });
    }),

    /**
     * Tạo subscription mới
     * POST /api/v1/subscriptions
     */
    createSubscription: asyncHandler(async (req, res) => {
        const subscription = await SubscriptionService.createSubscription(
            req.body,
            req.user.id
        );

        res.status(201).json({
            success: true,
            message: 'Tạo subscription thành công',
            data: { subscription }
        });
    }),

    /**
     * Lấy subscription hiện tại
     * GET /api/v1/subscriptions/active
     */
    getActiveSubscription: asyncHandler(async (req, res) => {
        const subscription = await SubscriptionService.getActiveSubscription(req.user.id);

        if (!subscription) {
            return res.json({
                success: true,
                message: 'Không có subscription đang hoạt động',
                data: { subscription: null }
            });
        }

        res.json({
            success: true,
            data: { subscription }
        });
    }),

    /**
     * Lấy lịch sử subscription
     * GET /api/v1/subscriptions/history
     */
    getSubscriptionHistory: asyncHandler(async (req, res) => {
        const subscriptions = await SubscriptionService.getSubscriptionHistory(req.user.id);

        res.json({
            success: true,
            data: { subscriptions }
        });
    }),

    /**
     * Hủy subscription
     * PUT /api/v1/subscriptions/:id/cancel
     */
    cancelSubscription: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const subscription = await SubscriptionService.cancelSubscription(id, req.user.id);

        res.json({
            success: true,
            message: 'Hủy subscription thành công',
            data: { subscription }
        });
    }),

    /**
     * Gia hạn subscription (Admin)
     * PUT /api/v1/subscriptions/:id/extend
     */
    extendSubscription: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { additionalDays } = req.body;

        if (!additionalDays || additionalDays <= 0) {
            throw new AppError('additionalDays must be a positive number', 400, 'INVALID_INPUT');
        }

        const subscription = await SubscriptionService.extendSubscription(id, additionalDays);

        res.json({
            success: true,
            message: 'Gia hạn subscription thành công',
            data: { subscription }
        });
    })
};

module.exports = SubscriptionController;
