const Joi = require('joi');
const conversationConfig = require('../config/conversation.config');

// Schema cho một câu trong hội thoại
const conversationLineSchema = Joi.object({
    speaker: Joi.string()
        .trim()
        .min(1)
        .max(10)
        .uppercase()
        .required()
        .messages({
            'string.min': 'ID người nói không được để trống',
            'string.max': 'ID người nói không được quá 10 ký tự',
            'any.required': 'Người nói là bắt buộc'
        }),
    speakerName: Joi.string()
        .trim()
        .max(50)
        .allow('')
        .messages({
            'string.max': 'Tên hiển thị người nói không được quá 50 ký tự'
        }),
    content: Joi.string()
        .trim()
        .min(1)
        .max(500)
        .required()
        .messages({
            'string.min': 'Nội dung câu không được để trống',
            'string.max': 'Nội dung câu không được quá 500 ký tự',
            'any.required': 'Nội dung câu là bắt buộc'
        }),
    translation: Joi.string()
        .trim()
        .max(500)
        .allow('')
        .messages({
            'string.max': 'Bản dịch không được quá 500 ký tự'
        }),
    audioUrl: Joi.string()
        .uri()
        .allow('')
        .messages({
            'string.uri': 'URL audio không hợp lệ'
        }),
    order: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'number.base': 'Thứ tự phải là số',
            'number.integer': 'Thứ tự phải là số nguyên',
            'number.min': 'Thứ tự phải lớn hơn 0',
            'any.required': 'Thứ tự là bắt buộc'
        })
});

// Schema cho người tham gia hội thoại
const participantSchema = Joi.object({
    id: Joi.string()
        .trim()
        .required()
        .messages({
            'any.required': 'ID người tham gia là bắt buộc'
        }),
    name: Joi.string()
        .trim()
        .min(1)
        .max(50)
        .required()
        .messages({
            'string.min': 'Tên người tham gia không được để trống',
            'string.max': 'Tên người tham gia không được quá 50 ký tự',
            'any.required': 'Tên người tham gia là bắt buộc'
        })
});

const conversationValidation = {
    // Validation cho tạo hội thoại mới
    create: Joi.object({
        title: Joi.string()
            .trim()
            .min(1)
            .max(200)
            .required()
            .messages({
                'string.min': 'Tiêu đề không được để trống',
                'string.max': 'Tiêu đề không được quá 200 ký tự',
                'any.required': 'Tiêu đề là bắt buộc'
            }),
        description: Joi.string()
            .trim()
            .max(1000)
            .allow('')
            .messages({
                'string.max': 'Mô tả không được quá 1000 ký tự'
            }),
        topic: Joi.string()
            .trim()
            .min(1)
            .max(100)
            .required()
            .messages({
                'string.min': 'Chủ đề không được để trống',
                'string.max': 'Chủ đề không được quá 100 ký tự',
                'any.required': 'Chủ đề là bắt buộc'
            }),
        level: Joi.string()
            .valid('beginner', 'intermediate', 'advanced')
            .default('beginner')
            .messages({
                'any.only': 'Level phải là beginner, intermediate hoặc advanced'
            }),
        lines: Joi.array()
            .items(conversationLineSchema)
            .min(conversationConfig.minLines)
            .max(conversationConfig.maxLines)
            .required()
            .messages({
                'array.min': `Hội thoại phải có ít nhất ${conversationConfig.minLines} câu`,
                'array.max': `Hội thoại không được quá ${conversationConfig.maxLines} câu`,
                'any.required': 'Nội dung hội thoại là bắt buộc'
            }),
        participants: Joi.array()
            .items(participantSchema)
            .min(conversationConfig.minParticipants)
            .max(conversationConfig.maxParticipants)
            .messages({
                'array.min': `Phải có ít nhất ${conversationConfig.minParticipants} người tham gia`,
                'array.max': `Không được quá ${conversationConfig.maxParticipants} người tham gia`
            }),
        duration: Joi.number()
            .min(1)
            .max(60)
            .messages({
                'number.min': 'Thời lượng phải ít nhất 1 phút',
                'number.max': 'Thời lượng không được quá 60 phút'
            }),
        tags: Joi.array()
            .items(
                Joi.string()
                    .trim()
                    .min(1)
                    .max(50)
                    .messages({
                        'string.min': 'Tag không được để trống',
                        'string.max': 'Tag không được quá 50 ký tự'
                    })
            )
            .max(10)
            .messages({
                'array.max': 'Không được quá 10 tags'
            }),
        difficulty: Joi.number()
            .integer()
            .min(1)
            .max(5)
            .default(1)
            .messages({
                'number.base': 'Độ khó phải là số',
                'number.integer': 'Độ khó phải là số nguyên',
                'number.min': 'Độ khó phải ít nhất 1',
                'number.max': 'Độ khó không được quá 5'
            })
    }),

    // Validation cho cập nhật hội thoại
    update: Joi.object({
        title: Joi.string()
            .trim()
            .min(1)
            .max(200)
            .messages({
                'string.min': 'Tiêu đề không được để trống',
                'string.max': 'Tiêu đề không được quá 200 ký tự'
            }),
        description: Joi.string()
            .trim()
            .max(1000)
            .allow('')
            .messages({
                'string.max': 'Mô tả không được quá 1000 ký tự'
            }),
        topic: Joi.string()
            .trim()
            .min(1)
            .max(100)
            .messages({
                'string.min': 'Chủ đề không được để trống',
                'string.max': 'Chủ đề không được quá 100 ký tự'
            }),
        level: Joi.string()
            .valid('beginner', 'intermediate', 'advanced')
            .messages({
                'any.only': 'Level phải là beginner, intermediate hoặc advanced'
            }),
        lines: Joi.array()
            .items(conversationLineSchema)
            .min(conversationConfig.minLines)
            .max(conversationConfig.maxLines)
            .messages({
                'array.min': `Hội thoại phải có ít nhất ${conversationConfig.minLines} câu`,
                'array.max': `Hội thoại không được quá ${conversationConfig.maxLines} câu`
            }),
        participants: Joi.array()
            .items(participantSchema)
            .min(conversationConfig.minParticipants)
            .max(conversationConfig.maxParticipants)
            .messages({
                'array.min': `Phải có ít nhất ${conversationConfig.minParticipants} người tham gia`,
                'array.max': `Không được quá ${conversationConfig.maxParticipants} người tham gia`
            }),
        duration: Joi.number()
            .min(1)
            .max(60)
            .messages({
                'number.min': 'Thời lượng phải ít nhất 1 phút',
                'number.max': 'Thời lượng không được quá 60 phút'
            }),
        tags: Joi.array()
            .items(
                Joi.string()
                    .trim()
                    .min(1)
                    .max(50)
                    .messages({
                        'string.min': 'Tag không được để trống',
                        'string.max': 'Tag không được quá 50 ký tự'
                    })
            )
            .max(10)
            .messages({
                'array.max': 'Không được quá 10 tags'
            }),
        difficulty: Joi.number()
            .integer()
            .min(1)
            .max(5)
            .messages({
                'number.base': 'Độ khó phải là số',
                'number.integer': 'Độ khó phải là số nguyên',
                'number.min': 'Độ khó phải ít nhất 1',
                'number.max': 'Độ khó không được quá 5'
            }),
        isActive: Joi.boolean()
            .messages({
                'boolean.base': 'Trạng thái hoạt động phải là true hoặc false'
            })
    }),

    // Validation cho query parameters
    query: Joi.object({
        page: Joi.number()
            .integer()
            .min(1)
            .default(1)
            .messages({
                'number.base': 'Trang phải là số',
                'number.integer': 'Trang phải là số nguyên',
                'number.min': 'Trang phải ít nhất 1'
            }),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(10)
            .messages({
                'number.base': 'Giới hạn phải là số',
                'number.integer': 'Giới hạn phải là số nguyên',
                'number.min': 'Giới hạn phải ít nhất 1',
                'number.max': 'Giới hạn không được quá 100'
            }),
        sortBy: Joi.string()
            .valid('title', 'topic', 'level', 'createdAt', 'updatedAt', 'usageCount')
            .default('createdAt')
            .messages({
                'any.only': 'Trường sắp xếp không hợp lệ'
            }),
        sortOrder: Joi.string()
            .valid('asc', 'desc')
            .default('desc')
            .messages({
                'any.only': 'Thứ tự sắp xếp phải là asc hoặc desc'
            }),
        topic: Joi.string()
            .trim()
            .max(100)
            .messages({
                'string.max': 'Chủ đề không được quá 100 ký tự'
            }),
        level: Joi.string()
            .valid('beginner', 'intermediate', 'advanced')
            .messages({
                'any.only': 'Level phải là beginner, intermediate hoặc advanced'
            }),
        isActive: Joi.boolean()
            .messages({
                'boolean.base': 'Trạng thái hoạt động phải là true hoặc false'
            }),
        tags: Joi.string()
            .pattern(/^[^,]+(,[^,]+)*$/)
            .messages({
                'string.pattern.base': 'Tags phải được phân cách bằng dấu phẩy'
            }),
        search: Joi.string()
            .trim()
            .max(200)
            .messages({
                'string.max': 'Từ khóa tìm kiếm không được quá 200 ký tự'
            })
    }),

    // Validation cho tìm kiếm
    search: Joi.object({
        q: Joi.string()
            .trim()
            .min(1)
            .max(200)
            .required()
            .messages({
                'string.min': 'Từ khóa tìm kiếm không được để trống',
                'string.max': 'Từ khóa tìm kiếm không được quá 200 ký tự',
                'any.required': 'Từ khóa tìm kiếm là bắt buộc'
            }),
        topic: Joi.string()
            .trim()
            .max(100)
            .messages({
                'string.max': 'Chủ đề không được quá 100 ký tự'
            }),
        level: Joi.string()
            .valid('beginner', 'intermediate', 'advanced')
            .messages({
                'any.only': 'Level phải là beginner, intermediate hoặc advanced'
            }),
        tags: Joi.string()
            .pattern(/^[^,]+(,[^,]+)*$/)
            .messages({
                'string.pattern.base': 'Tags phải được phân cách bằng dấu phẩy'
            })
    }),

    // Validation cho ID parameter
    id: Joi.object({
        id: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'ID không hợp lệ',
                'any.required': 'ID là bắt buộc'
            })
    }),

    topicQuery: Joi.object({
        includeInactive: Joi.boolean().default(false)
    }),

    topicId: Joi.object({
        topicId: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'ID chu de khong hop le',
                'any.required': 'ID chu de la bat buoc'
            })
    }),

    createTopic: Joi.object({
        name: Joi.string().trim().min(1).max(100).required(),
        description: Joi.string().trim().max(500).allow(''),
        icon: Joi.string().trim().max(10).allow(''),
        color: Joi.string().trim().max(20).allow(''),
        order: Joi.number().integer().min(0).default(0),
        isActive: Joi.boolean().default(true)
    }),

    updateTopic: Joi.object({
        name: Joi.string().trim().min(1).max(100),
        description: Joi.string().trim().max(500).allow(''),
        icon: Joi.string().trim().max(10).allow(''),
        color: Joi.string().trim().max(20).allow(''),
        order: Joi.number().integer().min(0),
        isActive: Joi.boolean()
    }).min(1)
    
};

module.exports = conversationValidation;

