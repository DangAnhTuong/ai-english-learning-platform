const Joi = require('joi');

const courseValidation = {
    createCourse: {
        body: Joi.object({
            title: Joi.string()
                .min(3)
                .max(200)
                .trim()
                .required()
                .messages({
                    'string.empty': 'Tên khóa học không được để trống',
                    'string.min': 'Tên khóa học phải có ít nhất 3 ký tự',
                    'string.max': 'Tên khóa học không được vượt quá 200 ký tự',
                    'any.required': 'Tên khóa học là bắt buộc'
                }),

            description: Joi.string()
                .min(10)
                .max(2000)
                .required()
                .messages({
                    'string.empty': 'Mô tả khóa học không được để trống',
                    'string.min': 'Mô tả khóa học phải có ít nhất 10 ký tự',
                    'string.max': 'Mô tả khóa học không được vượt quá 2000 ký tự',
                    'any.required': 'Mô tả khóa học là bắt buộc'
                }),

            shortDescription: Joi.string()
                .max(500)
                .optional()
                .messages({
                    'string.max': 'Mô tả ngắn không được vượt quá 500 ký tự'
                }),

            category: Joi.string()
                .valid('grammar', 'vocabulary', 'listening', 'speaking', 'reading', 'writing', 'pronunciation', 'business', 'ielts', 'toefl', 'conversation')
                .required()
                .messages({
                    'any.only': 'Danh mục khóa học không hợp lệ',
                    'any.required': 'Danh mục khóa học là bắt buộc'
                }),

            subcategory: Joi.string()
                .max(100)
                .optional(),

            level: Joi.string()
                .valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
                .required()
                .messages({
                    'any.only': 'Cấp độ khóa học không hợp lệ',
                    'any.required': 'Cấp độ khóa học là bắt buộc'
                }),

            difficulty: Joi.string()
                .valid('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'proficient')
                .required()
                .messages({
                    'any.only': 'Độ khó khóa học không hợp lệ',
                    'any.required': 'Độ khó khóa học là bắt buộc'
                }),

            enrollmentType: Joi.string()
                .valid('free', 'paid', 'premium')
                .default('free'),

            price: Joi.number()
                .min(0)
                .when('enrollmentType', {
                    is: 'paid',
                    then: Joi.number().min(1).required(),
                    otherwise: Joi.number().default(0)
                })
                .messages({
                    'number.min': 'Giá khóa học phải lớn hơn 0 cho khóa học trả phí',
                    'any.required': 'Giá khóa học là bắt buộc cho khóa học trả phí'
                }),

            currency: Joi.string()
                .valid('VND', 'USD')
                .default('VND'),

            tags: Joi.array()
                .items(Joi.string().max(50))
                .max(10)
                .optional()
                .messages({
                    'array.max': 'Không được có quá 10 tags'
                }),

            learningObjectives: Joi.array()
                .items(Joi.string().max(200))
                .max(10)
                .optional()
                .messages({
                    'array.max': 'Không được có quá 10 mục tiêu học tập'
                }),

            prerequisites: Joi.array()
                .items(Joi.string().max(200))
                .max(5)
                .optional(),

            targetAudience: Joi.array()
                .items(Joi.string().max(100))
                .max(5)
                .optional(),

            isPublic: Joi.boolean()
                .default(true),

            allowComments: Joi.boolean()
                .default(true),

            allowDownloads: Joi.boolean()
                .default(false),

            certificateEnabled: Joi.boolean()
                .default(false),

            language: Joi.string()
                .valid('vi', 'en')
                .default('vi'),

            subtitles: Joi.array()
                .items(Joi.string().valid('vi', 'en'))
                .optional(),

            startDate: Joi.date()
                .greater('now')
                .optional()
                .messages({
                    'date.greater': 'Ngày bắt đầu phải sau thời điểm hiện tại'
                }),

            endDate: Joi.date()
                .greater(Joi.ref('startDate'))
                .optional()
                .messages({
                    'date.greater': 'Ngày kết thúc phải sau ngày bắt đầu'
                }),

            isScheduled: Joi.boolean()
                .default(false)
        })
    },

    updateCourse: {
        body: Joi.object({
            title: Joi.string()
                .min(3)
                .max(200)
                .trim()
                .optional(),

            description: Joi.string()
                .min(10)
                .max(2000)
                .optional(),

            shortDescription: Joi.string()
                .max(500)
                .optional(),

            category: Joi.string()
                .valid('grammar', 'vocabulary', 'listening', 'speaking', 'reading', 'writing', 'pronunciation', 'business', 'ielts', 'toefl', 'conversation')
                .optional(),

            subcategory: Joi.string()
                .max(100)
                .optional(),

            level: Joi.string()
                .valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
                .optional(),

            difficulty: Joi.string()
                .valid('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'proficient')
                .optional(),

            enrollmentType: Joi.string()
                .valid('free', 'paid', 'premium')
                .optional(),

            price: Joi.number()
                .min(0)
                .optional(),

            currency: Joi.string()
                .valid('VND', 'USD')
                .optional(),

            tags: Joi.array()
                .items(Joi.string().max(50))
                .max(10)
                .optional(),

            learningObjectives: Joi.array()
                .items(Joi.string().max(200))
                .max(10)
                .optional(),

            prerequisites: Joi.array()
                .items(Joi.string().max(200))
                .max(5)
                .optional(),

            targetAudience: Joi.array()
                .items(Joi.string().max(100))
                .max(5)
                .optional(),

            isPublic: Joi.boolean()
                .optional(),

            allowComments: Joi.boolean()
                .optional(),

            allowDownloads: Joi.boolean()
                .optional(),

            certificateEnabled: Joi.boolean()
                .optional(),

            language: Joi.string()
                .valid('vi', 'en')
                .optional(),

            subtitles: Joi.array()
                .items(Joi.string().valid('vi', 'en'))
                .optional(),

            startDate: Joi.date()
                .greater('now')
                .optional(),

            endDate: Joi.date()
                .greater(Joi.ref('startDate'))
                .optional(),

            isScheduled: Joi.boolean()
                .optional(),

            thumbnail: Joi.string()
                .uri()
                .optional()
        }),

        params: Joi.object({
            courseId: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .required()
                .messages({
                    'string.pattern.base': 'ID khóa học không hợp lệ'
                })
        })
    },

    getCourses: {
        query: Joi.object({
            page: Joi.number()
                .integer()
                .min(1)
                .default(1),

            limit: Joi.number()
                .integer()
                .min(1)
                .max(50)
                .default(10),

            sortBy: Joi.string()
                .valid('createdAt', 'title', 'averageRating', 'enrolledStudents', 'price')
                .default('createdAt'),

            sortOrder: Joi.string()
                .valid('asc', 'desc')
                .default('desc'),

            category: Joi.string()
                .valid('grammar', 'vocabulary', 'listening', 'speaking', 'reading', 'writing', 'pronunciation', 'business', 'ielts', 'toefl', 'conversation')
                .optional(),

            level: Joi.string()
                .valid('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
                .optional(),

            difficulty: Joi.string()
                .valid('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'proficient')
                .optional(),

            enrollmentType: Joi.string()
                .valid('free', 'paid', 'premium')
                .optional(),

            search: Joi.string()
                .min(2)
                .max(100)
                .optional()
                .allow('')
                .custom((value, helpers) => {
                    // If empty string, convert to undefined to skip validation
                    if (value === '') {
                        return undefined;
                    }
                    return value;
                })
                .messages({
                    'string.min': 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự'
                }),

            tags: Joi.string()
                .optional(),

            creatorId: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .optional(),

            status: Joi.string()
                .valid('draft', 'published', 'archived', 'under_review')
                .optional()
        })
    },

    getCourseById: {
        params: Joi.object({
            courseId: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .required()
                .messages({
                    'string.pattern.base': 'ID khóa học không hợp lệ',
                    'any.required': 'ID khóa học là bắt buộc'
                })
        })
    },

    enrollInCourse: {
        params: Joi.object({
            courseId: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .required()
                .messages({
                    'string.pattern.base': 'ID khóa học không hợp lệ',
                    'any.required': 'ID khóa học là bắt buộc'
                })
        })
    }
};

module.exports = courseValidation;