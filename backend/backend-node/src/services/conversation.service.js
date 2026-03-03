const Conversation = require('../models/conversation');
const ConversationTopic = require('../models/conversationTopic');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const conversationConfig = require('../config/conversation.config');
const Logger = require('../utils/logger');

/**
 * Helper: Build participant map from conversation
 * Maps participant name -> participant info (id, voice settings, etc.)
 */
const buildParticipantMap = (conversation) => {
    const map = {};
    (conversation.participants || []).forEach((p, index) => {
        map[p.name] = {
            id: p.id || `P${index + 1}`,
            name: p.name,
            index
        };
    });
    return map;
};

/**
 * Helper: Get voice settings for a specific participant
 */
const getParticipantVoiceSettings = (voiceSettings, participantId) => {
    if (!voiceSettings || !participantId) {
        return { provider: 'openai', voice: 'alloy', speed: 1.0 };
    }
    return voiceSettings[participantId] || { provider: 'openai', voice: 'alloy', speed: 1.0 };
};

class ConversationService {
    static normalizeTopicName(topic = '') {
        return topic.normalize('NFC').trim();
    }
    /**
     * Tạo hội thoại mới
     * @param {Object} conversationData - Dữ liệu hội thoại
     * @param {string} userId - ID người tạo
     * @returns {Promise<Object>} Hội thoại đã tạo
     */
    static async createConversation(conversationData, userId) {
        const {
            title,
            description,
            topic,
            level,
            lines,
            participants,
            duration,
            tags,
            difficulty
        } = conversationData;

        // Kiểm tra trùng lặp title
        const existingConversation = await Conversation.findOne({ title });
        if (existingConversation) {
            throw new AppError('Tiêu đề hội thoại đã tồn tại', 400, 'DUPLICATE_TITLE');
        }

        // Validate số lượng câu
        if (!lines || lines.length < conversationConfig.minLines || lines.length > conversationConfig.maxLines) {
            throw new AppError(
                `Hội thoại phải có từ ${conversationConfig.minLines} đến ${conversationConfig.maxLines} câu`,
                400,
                'INVALID_LINES_COUNT'
            );
        }

        // Validate số lượng người tham gia
        const finalParticipants = participants || [
            { id: 'P1', name: 'Người A' },
            { id: 'P2', name: 'Người B' }
        ];
        if (finalParticipants.length < conversationConfig.minParticipants ||
            finalParticipants.length > conversationConfig.maxParticipants) {
            throw new AppError(
                `Hội thoại phải có từ ${conversationConfig.minParticipants} đến ${conversationConfig.maxParticipants} người tham gia`,
                400,
                'INVALID_PARTICIPANTS_COUNT'
            );
        }

        // Validate nội dung không trùng lặp
        await this.validateUniqueContent(lines);

        // Tạo hội thoại mới
        const conversation = await Conversation.create({
            title,
            description,
            topic,
            level,
            lines,
            participants: finalParticipants,
            duration,
            tags,
            difficulty,
            createdBy: userId,
            lastModifiedBy: userId,
            // Initialize audio generation status
            audioGenerationStatus: 'pending',
            audioGenerationProgress: 0
        });

        return conversation;
    }

    /**
     * Lấy danh sách hội thoại với filters
     * @param {Object} filters - Bộ lọc
     * @param {Object} pagination - Phân trang
     * @returns {Promise<Object>} Danh sách hội thoại và metadata
     */
    static async getConversations(filters = {}, pagination = {}) {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = pagination;

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const query = Conversation.findByFilters(filters);
        const conversations = await query
            .populate('creator', 'name email')
            .populate('lastModifier', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const total = await Conversation.countDocuments(query.getQuery());

        return {
            conversations,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Lấy hội thoại theo ID
     * @param {string} conversationId - ID hội thoại
     * @returns {Promise<Object>} Hội thoại
     */
    static async getConversationById(conversationId) {
        const conversation = await Conversation.findById(conversationId)
            .populate('creator', 'name email')
            .populate('lastModifier', 'name email');

        if (!conversation) {
            throw new AppError('Hội thoại không tồn tại', 404, 'CONVERSATION_NOT_FOUND');
        }

        return conversation;
    }

    /**
     * Cập nhật hội thoại
     * @param {string} conversationId - ID hội thoại
     * @param {Object} updateData - Dữ liệu cập nhật
     * @param {string} userId - ID người cập nhật
     * @param {Array} userRoles - Vai trò người dùng
     * @returns {Promise<Object>} Hội thoại đã cập nhật
     */
    static async updateConversation(conversationId, updateData, userId, userRoles) {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            throw new AppError('Hội thoại không tồn tại', 404, 'CONVERSATION_NOT_FOUND');
        }

        // Kiểm tra quyền chỉnh sửa
        if (!conversation.canEdit(userId, userRoles)) {
            throw new AppError('Bạn không có quyền chỉnh sửa hội thoại này', 403, 'INSUFFICIENT_PERMISSION');
        }

        // Kiểm tra trùng lặp title nếu có thay đổi
        if (updateData.title && updateData.title !== conversation.title) {
            const existingConversation = await Conversation.findOne({
                title: updateData.title,
                _id: { $ne: conversationId }
            });
            if (existingConversation) {
                throw new AppError('Tiêu đề hội thoại đã tồn tại', 400, 'DUPLICATE_TITLE');
            }
        }

        // Validate số lượng câu nếu có thay đổi
        if (updateData.lines) {
            if (updateData.lines.length < conversationConfig.minLines || updateData.lines.length > conversationConfig.maxLines) {
                throw new AppError(
                    `Hội thoại phải có từ ${conversationConfig.minLines} đến ${conversationConfig.maxLines} câu`,
                    400,
                    'INVALID_LINES_COUNT'
                );
            }
            await this.validateUniqueContent(updateData.lines, conversationId);
        }

        // Validate số lượng người tham gia nếu có thay đổi
        if (updateData.participants) {
            if (updateData.participants.length < conversationConfig.minParticipants ||
                updateData.participants.length > conversationConfig.maxParticipants) {
                throw new AppError(
                    `Hội thoại phải có từ ${conversationConfig.minParticipants} đến ${conversationConfig.maxParticipants} người tham gia`,
                    400,
                    'INVALID_PARTICIPANTS_COUNT'
                );
            }
        }

        // Cập nhật hội thoại
        Object.assign(conversation, updateData);
        conversation.lastModifiedBy = userId;

        await conversation.save();

        return conversation;
    }

    /**
     * Xóa hội thoại (soft delete)
     * @param {string} conversationId - ID hội thoại
     * @param {string} userId - ID người xóa
     * @param {Array} userRoles - Vai trò người dùng
     * @returns {Promise<boolean>} Kết quả xóa
     */
    static async deleteConversation(conversationId, userId, userRoles) {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            throw new AppError('Hội thoại không tồn tại', 404, 'CONVERSATION_NOT_FOUND');
        }

        // Kiểm tra quyền xóa
        if (!conversation.canEdit(userId, userRoles)) {
            throw new AppError('Bạn không có quyền xóa hội thoại này', 403, 'INSUFFICIENT_PERMISSION');
        }

        // Hard delete - xóa thực sự khỏi database
        await Conversation.findByIdAndDelete(conversationId);

        // Xóa audio files liên quan (nếu có)
        try {
            const axios = require('axios');
            const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
            await axios.delete(`${pythonApiUrl}/api/v1/conversation/audio/${conversationId}`);
        } catch (audioError) {
            // Log lỗi nhưng không throw - audio cleanup là optional
            console.warn(`Failed to cleanup audio files for conversation ${conversationId}:`, audioError.message);
        }

        return true;
    }

    /**
     * Xóa vĩnh viễn hội thoại
     * @param {string} conversationId - ID hội thoại
     * @param {string} userId - ID người xóa
     * @param {Array} userRoles - Vai trò người dùng
     * @returns {Promise<boolean>} Kết quả xóa
     */
    static async permanentDeleteConversation(conversationId, userId, userRoles) {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            throw new AppError('Hội thoại không tồn tại', 404, 'CONVERSATION_NOT_FOUND');
        }

        // Chỉ admin mới có quyền xóa vĩnh viễn
        if (!userRoles.includes('admin')) {
            throw new AppError('Chỉ admin mới có quyền xóa vĩnh viễn', 403, 'INSUFFICIENT_PERMISSION');
        }

        await Conversation.findByIdAndDelete(conversationId);
        return true;
    }

    /**
     * Khôi phục hội thoại đã xóa
     * @param {string} conversationId - ID hội thoại
     * @param {string} userId - ID người khôi phục
     * @param {Array} userRoles - Vai trò người dùng
     * @returns {Promise<Object>} Hội thoại đã khôi phục
     */
    static async restoreConversation(conversationId, userId, userRoles) {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            throw new AppError('Hội thoại không tồn tại', 404, 'CONVERSATION_NOT_FOUND');
        }

        // Kiểm tra quyền khôi phục
        if (!conversation.canEdit(userId, userRoles)) {
            throw new AppError('Bạn không có quyền khôi phục hội thoại này', 403, 'INSUFFICIENT_PERMISSION');
        }

        conversation.isActive = true;
        conversation.lastModifiedBy = userId;
        await conversation.save();

        return conversation;
    }

    /**
     * Lấy thống kê hội thoại
     * @returns {Promise<Object>} Thống kê
     */
    static async getConversationStats() {
        const stats = await Conversation.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: { $sum: { $cond: ['$isActive', 1, 0] } },
                    inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
                    byLevel: {
                        $push: {
                            level: '$level',
                            isActive: '$isActive'
                        }
                    },
                    byTopic: {
                        $push: {
                            topic: '$topic',
                            isActive: '$isActive'
                        }
                    }
                }
            }
        ]);

        if (stats.length === 0) {
            return {
                total: 0,
                active: 0,
                inactive: 0,
                byLevel: {},
                byTopic: {}
            };
        }

        const result = stats[0];

        // Thống kê theo level
        const levelStats = {};
        result.byLevel.forEach(item => {
            if (!levelStats[item.level]) {
                levelStats[item.level] = { total: 0, active: 0 };
            }
            levelStats[item.level].total++;
            if (item.isActive) levelStats[item.level].active++;
        });

        // Thống kê theo topic
        const topicStats = {};
        result.byTopic.forEach(item => {
            if (!topicStats[item.topic]) {
                topicStats[item.topic] = { total: 0, active: 0 };
            }
            topicStats[item.topic].total++;
            if (item.isActive) topicStats[item.topic].active++;
        });

        return {
            total: result.total,
            active: result.active,
            inactive: result.inactive,
            byLevel: levelStats,
            byTopic: topicStats
        };
    }

    /**
     * Validate nội dung không trùng lặp
     * @param {Array} lines - Danh sách câu hội thoại
     * @param {string} excludeId - ID hội thoại loại trừ (khi update)
     * @returns {Promise<void>}
     */
    static async validateUniqueContent(lines, excludeId = null) {
        const contentSet = new Set();

        for (const line of lines) {
            const content = line.content.toLowerCase().trim();

            // Kiểm tra trùng lặp trong cùng hội thoại
            if (contentSet.has(content)) {
                throw new AppError('Nội dung hội thoại bị trùng lặp', 400, 'DUPLICATE_CONTENT');
            }
            contentSet.add(content);
        }

        // Kiểm tra trùng lặp với hội thoại khác
        const contents = lines.map(line => line.content.toLowerCase().trim());
        const query = {
            'lines.content': { $in: contents }
        };

        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        const existingConversations = await Conversation.find(query);
        if (existingConversations.length > 0) {
            throw new AppError('Nội dung hội thoại đã tồn tại trong hệ thống', 400, 'DUPLICATE_CONTENT');
        }
    }

    /**
     * Tìm kiếm hội thoại theo từ khóa
     * @param {string} keyword - Từ khóa tìm kiếm
     * @param {Object} filters - Bộ lọc bổ sung
     * @returns {Promise<Array>} Danh sách hội thoại
     */
    static async searchConversations(keyword, filters = {}) {
        const searchFilters = {
            ...filters,
            search: keyword
        };

        const conversations = await Conversation.findByFilters(searchFilters)
            .populate('creator', 'name email')
            .populate('lastModifier', 'name email')
            .sort({ createdAt: -1 });

        return conversations;
    }

    /**
     * Lấy danh sách topics
     * @returns {Promise<Array>} Danh sách topics
     */
    static async getTopics() {
        const topicCounts = await Conversation.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$topic', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $project: { _id: 0, name: '$_id', count: 1 } }
        ]);

        const managedTopics = await ConversationTopic.find({ isActive: true }).sort({ order: 1, name: 1 });
        const countMap = new Map();
        topicCounts.forEach((topic) => {
            const normalizedName = this.normalizeTopicName(topic.name);
            if (!normalizedName) return;
            countMap.set(normalizedName, topic.count);
        });

        const merged = managedTopics.map((topic) => {
            const normalizedName = this.normalizeTopicName(topic.name);
            const count = countMap.get(normalizedName) || 0;
            countMap.delete(normalizedName);
            return {
                id: topic._id.toString(),
                name: topic.name,
                description: topic.description || '',
                icon: topic.icon || '💬',
                color: topic.color || '#1890ff',
                order: topic.order || 0,
                isActive: topic.isActive,
                count
            };
        });

        for (const [name, count] of countMap.entries()) {
            merged.push({
                id: null,
                name,
                description: '',
                icon: '💬',
                color: '#1890ff',
                order: 9999,
                isActive: true,
                count
            });
        }

        return merged.sort((a, b) => {
            if (a.order !== b.order) return a.order - b.order;
            if (b.count !== a.count) return b.count - a.count;
            return a.name.localeCompare(b.name);
        });
    }

    static async getTopicsAdmin(includeInactive = false) {
        const filter = includeInactive ? {} : { isActive: true };
        const [topics, counts] = await Promise.all([
            ConversationTopic.find(filter).sort({ order: 1, name: 1 }),
            Conversation.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$topic', count: { $sum: 1 } } }
            ])
        ]);

        const countMap = new Map();
        counts.forEach((item) => {
            const key = this.normalizeTopicName(item._id || '');
            if (key) countMap.set(key, item.count);
        });

        return topics.map((topic) => {
            const key = this.normalizeTopicName(topic.name);
            return {
                id: topic._id.toString(),
                name: topic.name,
                description: topic.description || '',
                icon: topic.icon || '💬',
                color: topic.color || '#1890ff',
                order: topic.order || 0,
                isActive: topic.isActive,
                count: countMap.get(key) || 0,
                createdAt: topic.createdAt,
                updatedAt: topic.updatedAt
            };
        });
    }

    static async createTopic(payload) {
        const name = this.normalizeTopicName(payload.name || '');
        if (!name) {
            throw new AppError('Chu de khong duoc de trong', 400, 'INVALID_TOPIC_NAME');
        }

        const exists = await ConversationTopic.findOne({ name });
        if (exists) {
            throw new AppError('Chu de da ton tai', 400, 'TOPIC_EXISTS');
        }

        const topic = await ConversationTopic.create({
            ...payload,
            name
        });
        return topic;
    }

    static async updateTopic(topicId, payload) {
        const topic = await ConversationTopic.findById(topicId);
        if (!topic) {
            throw new AppError('Khong tim thay chu de', 404, 'TOPIC_NOT_FOUND');
        }

        if (typeof payload.name === 'string') {
            const normalizedName = this.normalizeTopicName(payload.name);
            if (!normalizedName) {
                throw new AppError('Chu de khong duoc de trong', 400, 'INVALID_TOPIC_NAME');
            }
            if (normalizedName !== topic.name) {
                const exists = await ConversationTopic.findOne({ name: normalizedName, _id: { $ne: topicId } });
                if (exists) {
                    throw new AppError('Chu de da ton tai', 400, 'TOPIC_EXISTS');
                }
            }
            payload.name = normalizedName;
        }

        Object.assign(topic, payload);
        await topic.save();
        return topic;
    }

    static async deleteTopic(topicId) {
        const topic = await ConversationTopic.findById(topicId);
        if (!topic) {
            throw new AppError('Khong tim thay chu de', 404, 'TOPIC_NOT_FOUND');
        }

        topic.isActive = false;
        await topic.save();
        return topic;
    }

    /**
     * Generate audio cho conversation - TAT CA participants
     * Moi participant co the co voice settings rieng
     * @param {string} conversationId - ID conversation
     * @param {Object} voiceSettings - Voice settings cho tung participant { P1: {...}, P2: {...} }
     * @returns {Promise<Object>} Ket qua generate audio
     */
    static async generateAudio(conversationId, voiceSettings = null, useQueue = true) {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            throw new AppError('Hoi thoai khong ton tai', 404, 'CONVERSATION_NOT_FOUND');
        }

        // Build participant map
        const participantMap = buildParticipantMap(conversation);
        const participantNames = Object.keys(participantMap);

        if (participantNames.length === 0) {
            throw new AppError('Hoi thoai chua co nguoi tham gia.', 400, 'NO_PARTICIPANTS');
        }

        Logger.info(`Participants: ${participantNames.join(', ')}`);

        // Merge voice settings voi defaults
        const finalVoiceSettings = {};
        participantNames.forEach(name => {
            const participant = participantMap[name];
            finalVoiceSettings[participant.id] = voiceSettings?.[participant.id] || {
                provider: 'openai',
                voice: participant.index === 0 ? 'alloy' : (participant.index === 1 ? 'nova' : 'echo'),
                speed: 1.0
            };
        });

        // Tao danh sach lines voi voice settings tuong ung
        const linesToGenerate = conversation.lines.map(line => {
            const participant = participantMap[line.speaker];
            const participantId = participant?.id || 'P1';
            const lineVoiceSettings = finalVoiceSettings[participantId] || finalVoiceSettings['P1'];

            return {
                _id: line._id,
                content: line.content,
                speaker: line.speaker,
                order: line.order,
                participantId,
                voiceSettings: lineVoiceSettings
            };
        });

        if (linesToGenerate.length === 0) {
            throw new AppError('Hoi thoai chua co noi dung.', 400, 'NO_LINES');
        }

        Logger.info(`Total lines to generate: ${linesToGenerate.length}`);

        // Use queue for async processing
        if (useQueue) {
            const audioQueueService = require('./audioQueue.service');

            const jobId = await audioQueueService.enqueue(
                conversationId,
                linesToGenerate,
                finalVoiceSettings,
                participantMap
            );

            conversation.audioGenerationStatus = 'queued';
            conversation.audioGenerationProgress = 0;
            conversation.voiceSettings = finalVoiceSettings;
            await conversation.save();

            return {
                jobId,
                status: 'queued',
                totalLines: linesToGenerate.length,
                participants: participantNames,
                message: `Audio generation cho ${linesToGenerate.length} cau da duoc them vao queue`
            };
        }

        // Synchronous generation
        conversation.audioGenerationStatus = 'in_progress';
        conversation.audioGenerationProgress = 0;
        await conversation.save();

        try {
            const ConversationAudioService = require('./conversationAudio.service');
            const result = await ConversationAudioService.generateAudio(
                conversationId,
                linesToGenerate,
                finalVoiceSettings
            );

            // Update tat ca lines voi audio URLs
            conversation.lines.forEach(line => {
                const lineId = line._id.toString();
                if (result.audio_urls[lineId]) {
                    line.audioUrl = result.audio_urls[lineId];
                    line.audioStatus = 'completed';
                    line.audioMetadata = {
                        duration: result.metadata[lineId]?.duration || 0,
                        fileSize: result.metadata[lineId]?.fileSize || 0,
                        format: 'mp3',
                        generatedAt: new Date()
                    };
                } else {
                    line.audioStatus = 'failed';
                }
            });

            conversation.voiceSettings = finalVoiceSettings;
            conversation.audioGenerationStatus = result.failed > 0 ? 'partial' : 'completed';
            conversation.audioGenerationProgress = 100;
            conversation.audioGeneratedAt = new Date();
            await conversation.save();

            return {
                total_lines: result.total_lines,
                generated: result.generated,
                failed: result.failed,
                status: conversation.audioGenerationStatus
            };

        } catch (error) {
            conversation.audioGenerationStatus = 'failed';
            conversation.audioGenerationProgress = 0;
            await conversation.save();
            throw error;
        }
    }

    /**
     * Lay trang thai audio generation
     * @param {string} conversationId - ID conversation
     * @returns {Promise<Object>} Trang thai audio generation
     */
    static async getAudioStatus(conversationId) {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            throw new AppError('Hoi thoai khong ton tai', 404, 'CONVERSATION_NOT_FOUND');
        }

        const totalLines = conversation.lines.length;
        const linesWithAudio = conversation.lines.filter(line =>
            line.audioUrl && line.audioStatus === 'completed'
        ).length;

        const linesFailed = conversation.lines.filter(line =>
            line.audioStatus === 'failed'
        ).length;

        // Group by participant
        const participantMap = buildParticipantMap(conversation);
        const byParticipant = {};

        conversation.lines.forEach(line => {
            const participant = participantMap[line.speaker];
            const key = participant?.id || line.speaker;

            if (!byParticipant[key]) {
                byParticipant[key] = { total: 0, withAudio: 0, failed: 0, name: line.speaker };
            }
            byParticipant[key].total++;
            if (line.audioUrl && line.audioStatus === 'completed') {
                byParticipant[key].withAudio++;
            }
            if (line.audioStatus === 'failed') {
                byParticipant[key].failed++;
            }
        });

        return {
            status: conversation.audioGenerationStatus,
            progress: conversation.audioGenerationProgress,
            totalLines,
            linesWithAudio,
            linesFailed,
            byParticipant,
            voiceSettings: conversation.voiceSettings,
            audioGeneratedAt: conversation.audioGeneratedAt
        };
    }
}

module.exports = ConversationService;
