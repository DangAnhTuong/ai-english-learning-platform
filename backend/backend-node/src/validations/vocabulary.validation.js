const Joi = require('joi');

// Validation cho Word Family
const wordFamilySchema = Joi.object({
    word: Joi.string().trim().required(),
    type: Joi.string().valid('noun', 'verb', 'adjective', 'adverb', 'other').required(),
    meaning: Joi.string().trim().allow('', null)
});

// Validation cho Examples
const exampleSchema = Joi.object({
    sentence: Joi.string().trim().max(500).required(),
    translation: Joi.string().trim().max(500).allow('', null)
});

// Create vocabulary
const create = {
    body: Joi.object({
        word: Joi.string().trim().required()
            .messages({
                'string.empty': 'Từ vựng không được để trống',
                'any.required': 'Từ vựng là bắt buộc'
            }),
        displayWord: Joi.string().trim().optional(),
        type: Joi.string().valid('noun', 'verb', 'adjective', 'adverb', 'phrase', 'idiom').required()
            .messages({
                'any.required': 'Loại từ là bắt buộc',
                'any.only': 'Loại từ không hợp lệ'
            }),
        meaning: Joi.string().trim().max(2000).required()
            .messages({
                'string.empty': 'Nghĩa của từ không được để trống',
                'any.required': 'Nghĩa của từ là bắt buộc',
                'string.max': 'Nghĩa của từ không được quá 2000 ký tự'
            }),
        pronunciation: Joi.object({
            ipa: Joi.string().trim().allow('', null),
            audioUrl: Joi.string().trim().uri().allow('', null)
        }).optional(),
        synonyms: Joi.array().items(Joi.string().trim()).optional(),
        antonyms: Joi.array().items(Joi.string().trim()).optional(),
        wordFamily: Joi.array().items(wordFamilySchema).optional(),
        examples: Joi.array().items(exampleSchema).optional(),
        level: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner'),
        topics: Joi.array().items(Joi.string().trim().max(100)).optional(),
        imageUrl: Joi.string().trim().uri().allow('', null).optional(),
        teacherNotes: Joi.string().trim().max(1000).allow('', null).optional(),
        relatedConversations: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional(),
        difficulty: Joi.number().integer().min(1).max(5).default(1)
    })
};

// Update vocabulary
const update = {
    body: Joi.object({
        word: Joi.string().trim().optional(),
        displayWord: Joi.string().trim().optional(),
        type: Joi.string().valid('noun', 'verb', 'adjective', 'adverb', 'phrase', 'idiom').optional(),
        meaning: Joi.string().trim().max(2000).optional(),
        pronunciation: Joi.object({
            ipa: Joi.string().trim().allow('', null),
            audioUrl: Joi.string().trim().uri().allow('', null)
        }).optional(),
        synonyms: Joi.array().items(Joi.string().trim()).optional(),
        antonyms: Joi.array().items(Joi.string().trim()).optional(),
        wordFamily: Joi.array().items(wordFamilySchema).optional(),
        examples: Joi.array().items(exampleSchema).optional(),
        level: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
        topics: Joi.array().items(Joi.string().trim().max(100)).optional(),
        imageUrl: Joi.string().trim().uri().allow('', null).optional(),
        teacherNotes: Joi.string().trim().max(1000).allow('', null).optional(),
        relatedConversations: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional(),
        isActive: Joi.boolean().optional(),
        difficulty: Joi.number().integer().min(1).max(5).optional()
    }).min(1) // Ít nhất 1 field để update
};

// Query/List vocabularies
const query = {
    query: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        type: Joi.string().valid('noun', 'verb', 'adjective', 'adverb', 'phrase', 'idiom').optional(),
        level: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
        topic: Joi.string().trim().optional(),
        isActive: Joi.boolean().optional(),
        search: Joi.string().trim().optional(),
        sortBy: Joi.string().valid('word', 'createdAt', 'updatedAt', 'usageCount').default('createdAt'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    })
};

// Search vocabularies
const search = {
    query: Joi.object({
        q: Joi.string().trim().required()
            .messages({
                'string.empty': 'Từ khóa tìm kiếm không được để trống',
                'any.required': 'Từ khóa tìm kiếm là bắt buộc'
            }),
        type: Joi.string().valid('noun', 'verb', 'adjective', 'adverb', 'phrase', 'idiom').optional(),
        level: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
        limit: Joi.number().integer().min(1).max(50).default(10)
    })
};

// Get by ID
const id = {
    params: Joi.object({
        id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
            .messages({
                'string.pattern.base': 'ID không hợp lệ',
                'any.required': 'ID là bắt buộc'
            })
    })
};

module.exports = {
    create,
    update,
    query,
    search,
    id
};
