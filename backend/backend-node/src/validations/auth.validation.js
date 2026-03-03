const Joi = require('joi');

const authValidation = {
    register: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Email không hợp lệ',
                'any.required': 'Email là bắt buộc'
            }),
        password: Joi.string()
            .min(6)
            .required()
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .messages({
                'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự',
                'string.pattern.base': 'Mật khẩu phải có chữ hoa, chữ thường và số',
                'any.required': 'Mật khẩu là bắt buộc'
            }),
        name: Joi.string()
            .min(2)
            .max(50)
            .required()
            .messages({
                'string.min': 'Tên phải có ít nhất {#limit} ký tự',
                'string.max': 'Tên không được quá {#limit} ký tự',
                'any.required': 'Tên là bắt buộc'
            }),
        username: Joi.string()
            .min(3)
            .max(30)
            .required()
            .pattern(/^[a-zA-Z0-9_]+$/)
            .messages({
                'string.min': 'Tên người dùng phải có ít nhất {#limit} ký tự',
                'string.max': 'Tên người dùng không được quá {#limit} ký tự',
                'string.pattern.base': 'Tên người dùng chỉ được chứa chữ cái, số và dấu gạch dưới',
                'any.required': 'Tên người dùng là bắt buộc'
            }),
        phone: Joi.string()
            .pattern(/^[0-9+\-\s()]+$/)
            .min(10)
            .max(15)
            .required()
            .messages({
                'string.pattern.base': 'Số điện thoại không hợp lệ',
                'string.min': 'Số điện thoại phải có ít nhất {#limit} ký tự',
                'string.max': 'Số điện thoại không được quá {#limit} ký tự',
                'any.required': 'Số điện thoại là bắt buộc'
            })
    }),

    login: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Email không hợp lệ',
                'any.required': 'Email là bắt buộc'
            }),
        password: Joi.string()
            .required()
            .messages({
                'any.required': 'Mật khẩu là bắt buộc'
            })
    }),

    changePassword: Joi.object({
        oldPassword: Joi.string()
            .required()
            .messages({
                'any.required': 'Mật khẩu cũ là bắt buộc'
            }),
        newPassword: Joi.string()
            .min(6)
            .required()
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .messages({
                'string.min': 'Mật khẩu mới phải có ít nhất {#limit} ký tự',
                'string.pattern.base': 'Mật khẩu mới phải có chữ hoa, chữ thường và số',
                'any.required': 'Mật khẩu mới là bắt buộc'
            })
            .invalid(Joi.ref('oldPassword'))
            .messages({
                'any.invalid': 'Mật khẩu mới không được giống mật khẩu cũ'
            })
    }),

    refreshToken: Joi.object({
        refreshToken: Joi.string()
            .required()
            .messages({
                'any.required': 'Refresh token là bắt buộc'
            })
    }),

    forgotPassword: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Email không hợp lệ',
                'any.required': 'Email là bắt buộc'
            })
    }),

    resetPassword: Joi.object({
        token: Joi.string()
            .required()
            .messages({
                'any.required': 'Token là bắt buộc'
            }),
        newPassword: Joi.string()
            .min(6)
            .required()
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .messages({
                'string.min': 'Mật khẩu mới phải có ít nhất {#limit} ký tự',
                'string.pattern.base': 'Mật khẩu mới phải có chữ hoa, chữ thường và số',
                'any.required': 'Mật khẩu mới là bắt buộc'
            })
    }),

    verifyEmail: Joi.object({
        token: Joi.string()
            .required()
            .messages({
                'any.required': 'Token xác thực là bắt buộc'
            })
    })
};

module.exports = authValidation;