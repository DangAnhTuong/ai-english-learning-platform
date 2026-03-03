const Joi = require('joi');

const userValidation = {
    getUsers: {
        query: Joi.object({
            page: Joi.number()
                .integer()
                .min(1)
                .default(1),

            limit: Joi.number()
                .integer()
                .min(1)
                .max(100)
                .default(10),

            sortBy: Joi.string()
                .valid('createdAt', 'name', 'email', 'lastLoginAt', 'totalLogins')
                .default('createdAt'),

            sortOrder: Joi.string()
                .valid('asc', 'desc')
                .default('desc'),

            status: Joi.string()
                .valid('active', 'inactive', 'banned', 'pending')
                .optional(),

            roles: Joi.alternatives().try(
                Joi.string().valid('student', 'teacher', 'admin'),
                Joi.array().items(Joi.string().valid('student', 'teacher', 'admin'))
            ).optional(),

            search: Joi.string()
                .max(100)
                .optional()
                .allow('')
                .custom((value, helpers) => {
                    if (value === '') return undefined;
                    return value;
                }),

            email: Joi.string()
                .email()
                .optional(),

            isEmailVerified: Joi.boolean()
                .optional()
        })
    },

    getUserById: {
        params: Joi.object({
            userId: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .required()
                .messages({
                    'string.pattern.base': 'ID người dùng không hợp lệ'
                })
        })
    },

    createUser: {
        body: Joi.object({
            email: Joi.string()
                .email()
                .required()
                .messages({
                    'string.email': 'Email không hợp lệ',
                    'any.required': 'Email là bắt buộc'
                }),

            password: Joi.string()
                .min(6)
                .optional()
                .messages({
                    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự'
                }),

            name: Joi.string()
                .min(2)
                .max(50)
                .required()
                .messages({
                    'string.min': 'Tên phải có ít nhất 2 ký tự',
                    'string.max': 'Tên không được vượt quá 50 ký tự',
                    'any.required': 'Tên là bắt buộc'
                }),

            username: Joi.string()
                .min(3)
                .max(30)
                .pattern(/^[a-z0-9_]+$/)
                .optional()
                .messages({
                    'string.pattern.base': 'Username chỉ được chứa chữ thường, số và dấu gạch dưới'
                }),

            phone: Joi.string()
                .min(10)
                .max(15)
                .optional(),

            roles: Joi.array()
                .items(Joi.string().valid('student', 'teacher', 'admin'))
                .min(1)
                .optional()
                .default(['student']),

            status: Joi.string()
                .valid('active', 'inactive', 'banned', 'pending')
                .optional()
                .default('active')
        })
    },

    updateUser: {
        params: Joi.object({
            userId: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .required()
                .messages({
                    'string.pattern.base': 'ID người dùng không hợp lệ'
                })
        }),

        body: Joi.object({
            email: Joi.string()
                .email()
                .optional(),

            password: Joi.string()
                .min(6)
                .optional()
                .messages({
                    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự'
                }),

            name: Joi.string()
                .min(2)
                .max(50)
                .optional(),

            username: Joi.string()
                .min(3)
                .max(30)
                .pattern(/^[a-z0-9_]+$/)
                .optional(),

            phone: Joi.string()
                .min(10)
                .max(15)
                .optional(),

            status: Joi.string()
                .valid('active', 'inactive', 'banned', 'pending')
                .optional(),

            isEmailVerified: Joi.boolean()
                .optional()
        })
    },

    deleteUser: {
        params: Joi.object({
            userId: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .required()
                .messages({
                    'string.pattern.base': 'ID người dùng không hợp lệ'
                })
        })
    },

    banUser: {
        params: Joi.object({
            userId: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .required()
                .messages({
                    'string.pattern.base': 'ID người dùng không hợp lệ'
                })
        })
    },

    unbanUser: {
        params: Joi.object({
            userId: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .required()
                .messages({
                    'string.pattern.base': 'ID người dùng không hợp lệ'
                })
        })
    },

    updateUserRoles: {
        params: Joi.object({
            userId: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .required()
                .messages({
                    'string.pattern.base': 'ID người dùng không hợp lệ'
                })
        }),

        body: Joi.object({
            roles: Joi.array()
                .items(Joi.string().valid('student', 'teacher', 'admin'))
                .min(1)
                .required()
                .messages({
                    'array.min': 'Phải có ít nhất một vai trò',
                    'any.required': 'Roles là bắt buộc'
                })
        })
    }
};

module.exports = userValidation;
