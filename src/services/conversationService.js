import axios from 'axios';
import api from './api'; // Import api instance đã có auth token

/**
 * Conversation Service
 * Tích hợp với cả Node.js Backend (conversations với audio) và Python Backend (realtime AI)
 */

// Lấy base URL
const PYTHON_API_BASE_URL = process.env.REACT_APP_PYTHON_API_URL || 'http://localhost:8000/api/v1';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

// Tạo axios instance riêng cho Python backend (không dùng token từ Node.js)
const pythonApi = axios.create({
    baseURL: PYTHON_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

export const conversationService = {
    /**
     * ==================== NODE.JS API - CONVERSATIONS CÓ AUDIO ====================
     */

    /**
     * Lấy danh sách conversations từ Node.js backend (có audio)
     * @param {Object} filters - { topic, level, search, isActive }
     * @param {Object} pagination - { page, limit, sortBy, sortOrder }
     */
    async getConversationsWithAudio(filters = {}, pagination = {}) {
        const params = {
            page: pagination.page || 1,
            limit: pagination.limit || 50,
            sortBy: pagination.sortBy || 'createdAt',
            sortOrder: pagination.sortOrder || 'desc',
            isActive: true, // Chỉ lấy conversations active cho user học
        };

        // Normalize Unicode NFC cho tiếng Việt trước khi gửi lên API
        if (filters.topic) params.topic = filters.topic.normalize('NFC');
        if (filters.level) params.level = filters.level;
        if (filters.search) params.search = filters.search.normalize('NFC');

        const response = await api.get('/conversations', { params });
        return response.data;
    },

    /**
     * Lấy chi tiết conversation theo ID từ Node.js backend (có audio)
     */
    async getConversationWithAudio(conversationId) {
        const response = await api.get(`/conversations/${conversationId}`);
        return response.data;
    },

    /**
     * Lấy trạng thái audio của conversation
     */
    async getAudioStatus(conversationId) {
        const response = await api.get(`/conversations/${conversationId}/audio-status`);
        return response.data;
    },

    /**
     * Tăng số lần sử dụng conversation (khi user bắt đầu học)
     */
    async incrementUsage(conversationId) {
        const response = await api.post(`/conversations/${conversationId}/use`);
        return response.data;
    },

    /**
     * Lấy danh sách topics từ Node.js
     * @returns {Promise<Object>} { success: true, data: [{ name: 'restaurant', count: 5 }, ...] }
     */
    async getTopics() {
        const response = await api.get('/conversations/topics');
        return response.data;
    },

    /**
     * Lấy danh sách levels từ Node.js
     * @returns {Promise<Object>} { success: true, data: [{ value: 'beginner', label: 'Cơ bản' }, ...] }
     */
    async getLevels() {
        const response = await api.get('/conversations/levels');
        return response.data;
    },

    /**
     * Lấy cấu hình conversation từ Node.js
     * @returns {Promise<Object>} { success: true, data: { minLines, maxLines, minParticipants, maxParticipants } }
     */
    async getConfig() {
        const response = await api.get('/conversations/config');
        return response.data;
    },

    /**
     * Lấy danh sách voices có sẵn từ Node.js
     * @returns {Promise<Object>} { success: true, data: { openai: [...], deepgram: [...], providers: [...] } }
     */
    async getVoicesFromBackend() {
        const response = await api.get('/conversations/voices');
        return response.data;
    },

    /**
     * Tạo full URL cho audio file
     */
    getFullAudioUrl(audioUrl) {
        if (!audioUrl) return null;
        if (audioUrl.startsWith('http')) return audioUrl;

        // Audio được serve từ Python backend
        // audioUrl format: /api/v1/conversation/audio/{conversationId}/{filename}
        if (audioUrl.startsWith('/api/v1')) {
            return `${PYTHON_API_BASE_URL.replace('/api/v1', '')}${audioUrl}`;
        }
        return `${PYTHON_API_BASE_URL}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
    },

    /**
     * ==================== PYTHON API - ADMIN ENDPOINTS ====================
     */

    /**
     * Tạo conversation scenario mới (Admin)
     */
    async createScenario(scenarioData) {
        const response = await pythonApi.post('/conversation/scenarios', scenarioData);
        return response.data;
    },

    /**
     * Lấy danh sách scenarios với filter (Python backend - deprecated, dùng getConversationsWithAudio)
     * @param {Object} filters - { topic, level, page, page_size }
     */
    async getScenarios(filters = {}) {
        const params = {
            page: filters.page || 1,
            page_size: filters.page_size || 100,
        };
        if (filters.topic) params.topic = filters.topic;
        if (filters.level) params.level = filters.level;

        const response = await pythonApi.get('/conversation/scenarios', { params });
        return response.data;
    },

    /**
     * Lấy scenario theo ID
     */
    async getScenario(scenarioId) {
        const response = await pythonApi.get(`/conversation/scenarios/${scenarioId}`);
        return response.data;
    },

    /**
     * Cập nhật scenario
     */
    async updateScenario(scenarioId, updates) {
        const response = await pythonApi.put(`/conversation/scenarios/${scenarioId}`, updates);
        return response.data;
    },

    /**
     * Xóa scenario
     */
    async deleteScenario(scenarioId) {
        const response = await pythonApi.delete(`/conversation/scenarios/${scenarioId}`);
        return response.data;
    },

    /**
     * Lấy thống kê (Admin)
     */
    async getStats() {
        const response = await pythonApi.get('/conversation/stats');
        return response.data;
    },

    /**
     * ==================== USER PRACTICE ENDPOINTS ====================
     */

    /**
     * Bắt đầu conversation session
     * @param {Object} request - { scenario_id, user_id }
     */
    async startSession(scenarioId, userId) {
        const response = await pythonApi.post('/conversation/sessions/start', {
            scenario_id: scenarioId,
            user_id: userId
        });
        return response.data;
    },

    /**
     * Gửi message trong session
     * @param {string} sessionId - Session ID
     * @param {Object} messageData - { message, audio_data (optional) }
     */
    async sendMessage(sessionId, messageData) {
        const response = await pythonApi.post(
            `/conversation/sessions/${sessionId}/message`,
            messageData
        );
        return response.data;
    },

    /**
     * Interrupt AI đang nói
     */
    async interruptAI(sessionId) {
        const response = await pythonApi.post(`/conversation/sessions/${sessionId}/interrupt`);
        return response.data;
    },

    /**
     * Kết thúc conversation session
     */
    async endSession(sessionId) {
        const response = await pythonApi.post(`/conversation/sessions/${sessionId}/end`);
        return response.data;
    },

    /**
     * Lấy thông tin session
     */
    async getSession(sessionId) {
        const response = await pythonApi.get(`/conversation/sessions/${sessionId}`);
        return response.data;
    },

    /**
     * ==================== USER PROGRESS ENDPOINTS ====================
     */

    /**
     * Lấy progress của user
     */
    async getUserProgress(userId) {
        const response = await pythonApi.get(`/conversation/users/${userId}/progress`);
        return response.data;
    },

    /**
     * Lấy danh sách sessions của user
     */
    async getUserSessions(userId, filters = {}) {
        const params = {
            page: filters.page || 1,
            page_size: filters.page_size || 10,
        };
        if (filters.scenario_id) params.scenario_id = filters.scenario_id;

        const response = await pythonApi.get(`/conversation/users/${userId}/sessions`, { params });
        return response.data;
    },

    /**
     * ==================== AUDIO ENDPOINTS ====================
     */

    /**
     * Generate audio cho conversation lines
     */
    async generateAudio(conversationId, lines, voiceSettings) {
        const response = await pythonApi.post('/conversation/generate-audio', {
            conversation_id: conversationId,
            lines,
            voice_settings: voiceSettings
        });
        return response.data;
    },

    /**
     * Lấy URL audio file
     */
    getAudioUrl(conversationId, filename) {
        return `${PYTHON_API_BASE_URL}/conversation/audio/${conversationId}/${filename}`;
    },

    /**
     * ==================== UTILITY ENDPOINTS ====================
     */

    /**
     * Lấy danh sách voices có sẵn
     */
    async getAvailableVoices() {
        const response = await pythonApi.get('/conversation/voices');
        return response.data;
    },

    /**
     * Optimize voice config
     */
    async optimizeVoiceConfig(characterName, characterDescription, level) {
        const response = await pythonApi.post('/conversation/voice/optimize', {
            character_name: characterName,
            character_description: characterDescription,
            conversation_level: level
        });
        return response.data;
    },

    /**
     * Health check
     */
    async healthCheck() {
        const response = await pythonApi.get('/conversation/health');
        return response.data;
    },

    /**
     * ==================== WEBSOCKET HELPERS ====================
     */

    /**
     * Tạo WebSocket connection
     * @param {string} connectionId - Unique connection ID
     * @returns {WebSocket}
     */
    createWebSocketConnection(connectionId) {
        const wsUrl = `${WS_BASE_URL}/ws/conversation/${connectionId}`;
        return new WebSocket(wsUrl);
    },

    /**
     * WebSocket message types
     */
    WS_MESSAGE_TYPES: {
        START_CONVERSATION: 'start_conversation',
        SEND_MESSAGE: 'send_message',
        SEND_AUDIO: 'send_audio',
        INTERRUPT_AI: 'interrupt_ai',
        END_CONVERSATION: 'end_conversation',
        PING: 'ping'
    },

    /**
     * WebSocket response types
     */
    WS_RESPONSE_TYPES: {
        CONNECTION_ESTABLISHED: 'connection_established',
        CONVERSATION_STARTED: 'conversation_started',
        CONVERSATION_MESSAGE: 'conversation_message',
        AI_RESPONSE: 'ai_response',
        AI_TYPING: 'ai_typing',
        TRANSCRIPT: 'transcript',
        AI_INTERRUPTED: 'ai_interrupted',
        CONVERSATION_ENDED: 'conversation_ended',
        ERROR: 'error',
        PONG: 'pong'
    }
};

export default conversationService;
