const ConversationService = require('../services/conversation.service');
const AppError = require('../utils/AppError');

// Wrapper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const ConversationController = {
    /**
     * Tạo hội thoại mới
     * POST /api/conversations
     */
    createConversation: asyncHandler(async (req, res) => {
        const conversationData = req.body;
        const userId = req.user.id;
        const userRoles = req.user.roles;

        // Kiểm tra quyền tạo hội thoại
        if (!userRoles.includes('admin') && !userRoles.includes('teacher')) {
            throw new AppError('Bạn không có quyền tạo hội thoại', 403, 'INSUFFICIENT_PERMISSION');
        }

        const conversation = await ConversationService.createConversation(conversationData, userId);

        res.status(201).json({
            success: true,
            message: 'Tạo hội thoại thành công',
            data: conversation
        });
    }),

    /**
     * Lấy danh sách hội thoại
     * GET /api/conversations
     */
    getConversations: asyncHandler(async (req, res) => {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            topic,
            level,
            isActive,
            tags,
            search
        } = req.query;

        const filters = {
            topic,
            level,
            // Hỗ trợ cả string 'true' (raw query) và boolean true (sau Joi convert)
            isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : undefined,
            tags: tags ? (typeof tags === 'string' ? tags.split(',') : tags) : undefined,
            search
        };

        const pagination = {
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy,
            sortOrder
        };

        const result = await ConversationService.getConversations(filters, pagination);

        res.json({
            success: true,
            data: result.conversations,
            pagination: result.pagination
        });
    }),

    /**
     * Lấy hội thoại theo ID
     * GET /api/conversations/:id
     */
    getConversationById: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const conversation = await ConversationService.getConversationById(id);

        res.json({
            success: true,
            data: conversation
        });
    }),

    /**
     * Cập nhật hội thoại
     * PUT /api/conversations/:id
     */
    updateConversation: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        const userId = req.user.id;
        const userRoles = req.user.roles;

        const conversation = await ConversationService.updateConversation(
            id,
            updateData,
            userId,
            userRoles
        );

        res.json({
            success: true,
            message: 'Cập nhật hội thoại thành công',
            data: conversation
        });
    }),

    /**
     * Xóa hội thoại (soft delete)
     * DELETE /api/conversations/:id
     */
    deleteConversation: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;
        const userRoles = req.user.roles;

        await ConversationService.deleteConversation(id, userId, userRoles);

        res.json({
            success: true,
            message: 'Xóa hội thoại thành công'
        });
    }),

    /**
     * Xóa vĩnh viễn hội thoại
     * DELETE /api/conversations/:id/permanent
     */
    permanentDeleteConversation: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;
        const userRoles = req.user.roles;

        await ConversationService.permanentDeleteConversation(id, userId, userRoles);

        res.json({
            success: true,
            message: 'Xóa vĩnh viễn hội thoại thành công'
        });
    }),

    /**
     * Khôi phục hội thoại đã xóa
     * POST /api/conversations/:id/restore
     */
    restoreConversation: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;
        const userRoles = req.user.roles;

        const conversation = await ConversationService.restoreConversation(id, userId, userRoles);

        res.json({
            success: true,
            message: 'Khôi phục hội thoại thành công',
            data: conversation
        });
    }),

    /**
     * Lấy thống kê hội thoại
     * GET /api/conversations/stats
     */
    getConversationStats: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const userRoles = req.user.roles;

        // Chỉ admin và teacher mới xem được thống kê
        if (!userRoles.includes('admin') && !userRoles.includes('teacher')) {
            throw new AppError('Bạn không có quyền xem thống kê', 403, 'INSUFFICIENT_PERMISSION');
        }

        const stats = await ConversationService.getConversationStats();

        res.json({
            success: true,
            data: stats
        });
    }),

    /**
     * Tìm kiếm hội thoại
     * GET /api/conversations/search
     */
    searchConversations: asyncHandler(async (req, res) => {
        const { q: keyword, topic, level, tags } = req.query;

        if (!keyword) {
            throw new AppError('Từ khóa tìm kiếm là bắt buộc', 400, 'MISSING_SEARCH_KEYWORD');
        }

        const filters = {
            topic,
            level,
            tags: tags ? tags.split(',') : undefined
        };

        const conversations = await ConversationService.searchConversations(keyword, filters);

        res.json({
            success: true,
            data: conversations,
            count: conversations.length
        });
    }),

    /**
     * Lấy danh sách topics
     * GET /api/conversations/topics
     */
    getTopics: asyncHandler(async (req, res) => {
        const topics = await ConversationService.getTopics();

        res.json({
            success: true,
            data: topics
        });
    }),

    getTopicsAdmin: asyncHandler(async (req, res) => {
        const includeInactive = req.query.includeInactive === true || req.query.includeInactive === 'true';
        const topics = await ConversationService.getTopicsAdmin(includeInactive);

        res.json({
            success: true,
            data: topics
        });
    }),

    createTopic: asyncHandler(async (req, res) => {
        const topic = await ConversationService.createTopic(req.body);
        const [topicWithStats] = await ConversationService.getTopicsAdmin(true)
            .then((items) => items.filter((item) => item.id === topic._id.toString()));

        res.status(201).json({
            success: true,
            message: 'Tao chu de thanh cong',
            data: topicWithStats || {
                id: topic._id.toString(),
                name: topic.name,
                description: topic.description || '',
                icon: topic.icon || '💬',
                color: topic.color || '#1890ff',
                order: topic.order || 0,
                isActive: topic.isActive
            }
        });
    }),

    updateTopic: asyncHandler(async (req, res) => {
        const { topicId } = req.params;
        const topic = await ConversationService.updateTopic(topicId, req.body);
        const [topicWithStats] = await ConversationService.getTopicsAdmin(true)
            .then((items) => items.filter((item) => item.id === topic._id.toString()));

        res.json({
            success: true,
            message: 'Cap nhat chu de thanh cong',
            data: topicWithStats
        });
    }),

    deleteTopic: asyncHandler(async (req, res) => {
        const { topicId } = req.params;
        const topic = await ConversationService.deleteTopic(topicId);

        res.json({
            success: true,
            message: 'An chu de thanh cong',
            data: {
                id: topic._id.toString(),
                isActive: topic.isActive
            }
        });
    }),

    /**
     * Lấy danh sách levels
     * GET /api/conversations/levels
     */
    getLevels: asyncHandler(async (req, res) => {
        const levels = [
            { value: 'beginner', label: 'Cơ bản' },
            { value: 'intermediate', label: 'Trung cấp' },
            { value: 'advanced', label: 'Nâng cao' }
        ];

        res.json({
            success: true,
            data: levels
        });
    }),

    /**
     * Lấy cấu hình conversation
     * GET /api/conversations/config
     */
    getConfig: asyncHandler(async (req, res) => {
        const conversationConfig = require('../config/conversation.config');

        res.json({
            success: true,
            data: {
                minLines: conversationConfig.minLines,
                maxLines: conversationConfig.maxLines,
                minParticipants: conversationConfig.minParticipants,
                maxParticipants: conversationConfig.maxParticipants
            }
        });
    }),

    /**
     * Lấy danh sách voices có sẵn
     * GET /api/conversations/voices
     */
    getVoices: asyncHandler(async (req, res) => {
        // OpenAI TTS voices
        const openaiVoices = [
            { id: 'alloy', name: 'Alloy', provider: 'openai', gender: 'neutral', description: 'Balanced, natural voice' },
            { id: 'echo', name: 'Echo', provider: 'openai', gender: 'male', description: 'Clear, professional' },
            { id: 'fable', name: 'Fable', provider: 'openai', gender: 'neutral', description: 'Warm, friendly' },
            { id: 'onyx', name: 'Onyx', provider: 'openai', gender: 'male', description: 'Deep, authoritative' },
            { id: 'nova', name: 'Nova', provider: 'openai', gender: 'female', description: 'Bright, energetic' },
            { id: 'shimmer', name: 'Shimmer', provider: 'openai', gender: 'female', description: 'Soft, gentle' }
        ];

        // Deepgram Aura voices (if configured)
        const deepgramVoices = [
            { id: 'aura-asteria-en', name: 'Asteria', provider: 'deepgram', gender: 'female', description: 'Warm and conversational' },
            { id: 'aura-luna-en', name: 'Luna', provider: 'deepgram', gender: 'female', description: 'Clear and professional' },
            { id: 'aura-stella-en', name: 'Stella', provider: 'deepgram', gender: 'female', description: 'Friendly and engaging' },
            { id: 'aura-athena-en', name: 'Athena', provider: 'deepgram', gender: 'female', description: 'Confident and articulate' },
            { id: 'aura-orion-en', name: 'Orion', provider: 'deepgram', gender: 'male', description: 'Deep and authoritative' },
            { id: 'aura-arcas-en', name: 'Arcas', provider: 'deepgram', gender: 'male', description: 'Natural and conversational' }
        ];

        res.json({
            success: true,
            data: {
                openai: openaiVoices,
                deepgram: deepgramVoices,
                providers: ['openai', 'deepgram']
            }
        });
    }),

    /**
     * Tăng số lần sử dụng hội thoại
     * POST /api/conversations/:id/use
     */
    incrementUsage: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const conversation = await ConversationService.getConversationById(id);

        await conversation.incrementUsage();

        res.json({
            success: true,
            message: 'Cập nhật số lần sử dụng thành công'
        });
    }),

    /**
     * Generate audio cho conversation
     * POST /api/conversations/:id/generate-audio
     */
    generateAudio: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { voiceSettings, useQueue = true } = req.body;
        const userId = req.user.id;
        const userRoles = req.user.roles;

        // Kiểm tra quyền
        if (!userRoles.includes('admin') && !userRoles.includes('teacher')) {
            throw new AppError('Bạn không có quyền generate audio', 403, 'INSUFFICIENT_PERMISSION');
        }

        // Kiểm tra conversation tồn tại và có quyền
        const conversation = await ConversationService.getConversationById(id);
        if (!conversation.canEdit(userId, userRoles)) {
            throw new AppError('Bạn không có quyền generate audio cho hội thoại này', 403, 'INSUFFICIENT_PERMISSION');
        }

        const result = await ConversationService.generateAudio(id, voiceSettings, useQueue);

        res.json({
            success: true,
            message: useQueue ? 'Audio generation đã được thêm vào queue' : 'Generate audio thành công',
            data: result
        });
    }),

    /**
     * Lấy trạng thái audio generation
     * GET /api/conversations/:id/audio-status
     */
    getAudioStatus: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const status = await ConversationService.getAudioStatus(id);

        res.json({
            success: true,
            data: status
        });
    }),

    /**
     * Serve audio file (proxy từ Python API hoặc serve trực tiếp)
     * GET /api/conversations/audio/:conversationId/:filename
     */
    serveAudio: asyncHandler(async (req, res) => {
        const { conversationId, filename } = req.params;

        // Proxy request đến Python API để serve audio file
        const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
        const axios = require('axios');

        try {
            const response = await axios.get(
                `${pythonApiUrl}/api/v1/conversation/audio/${conversationId}/${filename}`,
                {
                    responseType: 'stream',
                    timeout: 10000
                }
            );

            // Set headers
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 year

            // Pipe response
            response.data.pipe(res);

        } catch (error) {
            throw new AppError('Không tìm thấy file audio', 404, 'AUDIO_FILE_NOT_FOUND');
        }
    })
};

module.exports = ConversationController;

