const Joi = require('joi');

const orderValidation = {
    createOrder: {
        body: Joi.object({
            package: Joi.object({
                name: Joi.string().required().messages({
                    'string.empty': 'Tên gói không được để trống',
                    'any.required': 'Tên gói là bắt buộc'
                }),
                duration: Joi.number().integer().min(1).required().messages({
                    'number.base': 'Thời hạn phải là số',
                    'number.min': 'Thời hạn phải lớn hơn 0',
                    'any.required': 'Thời hạn là bắt buộc'
                }),
                plan: Joi.string().valid('free', 'basic', 'premium', 'vip').optional()
            }).required(),
            amount: Joi.number().min(0).required().messages({
                'number.base': 'Giá tiền phải là số',
                'number.min': 'Giá tiền không được âm',
                'any.required': 'Giá tiền là bắt buộc'
            }),
            currency: Joi.string().default('VND'),
            discount: Joi.number().min(0).default(0),
            paymentMethod: Joi.string().valid('bank_transfer', 'qr_code', 'cash', 'other').default('bank_transfer'),
            transferContent: Joi.string().optional(),
            bankInfo: Joi.object({
                bankName: Joi.string().optional(),
                accountNo: Joi.string().optional(),
                accountName: Joi.string().optional()
            }).optional(),
            notes: Joi.string().optional(),
            metadata: Joi.object({
                ipAddress: Joi.string().optional(),
                userAgent: Joi.string().optional(),
                referrer: Joi.string().optional()
            }).optional()
        })
    },

    getOrders: {
        query: Joi.object({
            userId: Joi.string().optional(),
            status: Joi.string().valid('pending', 'paid', 'failed', 'cancelled').optional(),
            paymentStatus: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded').optional(),
            dateFrom: Joi.date().optional(),
            dateTo: Joi.date().optional(),
            search: Joi.string().optional(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            sortBy: Joi.string().default('createdAt'),
            sortOrder: Joi.string().valid('asc', 'desc').default('desc')
        })
    },

    getOrderById: {
        params: Joi.object({
            orderId: Joi.string().required().messages({
                'string.empty': 'Order ID không được để trống',
                'any.required': 'Order ID là bắt buộc'
            })
        })
    },

    updateOrderStatus: {
        params: Joi.object({
            orderId: Joi.string().required()
        }),
        body: Joi.object({
            status: Joi.string().valid('paid', 'failed', 'cancelled', 'refunded').required().messages({
                'any.only': 'Trạng thái không hợp lệ',
                'any.required': 'Trạng thái là bắt buộc'
            }),
            transactionId: Joi.string().optional()
        })
    },

    verifyPayment: {
        params: Joi.object({
            orderId: Joi.string().required()
        }),
        body: Joi.object({
            transactionId: Joi.string().optional()
        })
    },

    getOrderStats: {
        query: Joi.object({
            dateFrom: Joi.date().optional(),
            dateTo: Joi.date().optional()
        })
    }
};

module.exports = orderValidation;
