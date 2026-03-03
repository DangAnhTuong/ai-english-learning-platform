const Joi = require('joi');

const subscriptionValidation = {
    createSubscription: {
        body: Joi.object({
            plan: Joi.string().valid('free', 'basic', 'premium', 'vip').required().messages({
                'any.only': 'Plan không hợp lệ',
                'any.required': 'Plan là bắt buộc'
            }),
            duration: Joi.number().integer().min(1).required().messages({
                'number.base': 'Thời hạn phải là số',
                'number.min': 'Thời hạn phải lớn hơn 0',
                'any.required': 'Thời hạn là bắt buộc'
            }),
            paymentMethod: Joi.string().optional(),
            autoRenew: Joi.boolean().default(false)
        })
    },

    cancelSubscription: {
        params: Joi.object({
            id: Joi.string().required()
        })
    },

    extendSubscription: {
        params: Joi.object({
            id: Joi.string().required()
        }),
        body: Joi.object({
            additionalDays: Joi.number().integer().min(1).required().messages({
                'number.base': 'Số ngày phải là số',
                'number.min': 'Số ngày phải lớn hơn 0',
                'any.required': 'Số ngày là bắt buộc'
            })
        })
    },

    planQuery: {
        query: Joi.object({
            includeInactive: Joi.boolean().default(false)
        })
    },

    planId: {
        params: Joi.object({
            id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .required()
                .messages({
                    'string.pattern.base': 'ID gói cước không hợp lệ',
                    'any.required': 'ID gói cước là bắt buộc'
                })
        })
    },

    createPlan: {
        body: Joi.object({
            code: Joi.string().trim().min(2).max(50).required(),
            name: Joi.string().trim().min(2).max(100).required(),
            type: Joi.string().valid('free', 'basic', 'premium', 'vip').required(),
            price: Joi.number().min(0).required(),
            currency: Joi.string().trim().max(10).default('VND'),
            duration: Joi.number().integer().min(1).required(),
            durationLabel: Joi.string().trim().max(50).allow(''),
            features: Joi.array().items(Joi.string().trim().max(200)).max(20).default([]),
            discount: Joi.number().min(0).max(100).allow(null).default(null),
            isPopular: Joi.boolean().default(false),
            color: Joi.string().trim().max(20).default('#597ef7'),
            order: Joi.number().integer().min(0).default(0),
            isActive: Joi.boolean().default(true)
        })
    },

    updatePlan: {
        body: Joi.object({
            code: Joi.string().trim().min(2).max(50),
            name: Joi.string().trim().min(2).max(100),
            type: Joi.string().valid('free', 'basic', 'premium', 'vip'),
            price: Joi.number().min(0),
            currency: Joi.string().trim().max(10),
            duration: Joi.number().integer().min(1),
            durationLabel: Joi.string().trim().max(50).allow(''),
            features: Joi.array().items(Joi.string().trim().max(200)).max(20),
            discount: Joi.number().min(0).max(100).allow(null),
            isPopular: Joi.boolean(),
            color: Joi.string().trim().max(20),
            order: Joi.number().integer().min(0),
            isActive: Joi.boolean()
        }).min(1)
    }
};

module.exports = subscriptionValidation;
