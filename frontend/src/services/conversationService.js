import axios from 'axios';
import api from './api'; // Đây là kết nối tới Node.js (Cổng 3001)

/**
 * BẢN CHỐT: HIỆN DANH SÁCH TỪ NODE.JS & CHẤM ĐIỂM TỪ PYTHON
 */

// Địa chỉ của Python AI
const PYTHON_API_URL = process.env.REACT_APP_PYTHON_API_URL ? `${process.env.REACT_APP_PYTHON_API_URL}/api/v1` : 'http://localhost:8000/api/v1';

const pythonApi = axios.create({
    baseURL: PYTHON_API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
});

export const conversationService = {
    /**
     * ==================== 1. LẤY DỮ LIỆU TỪ NODE.JS (Để hiện danh sách) ====================
     */
    async getConversationsWithAudio(filters = {}, pagination = {}) {
        const params = {
            page: pagination.page || 1,
            limit: pagination.limit || 50,
            isActive: true,
            ...filters
        };
        // Gọi về Node.js (Cổng 3001) như ban đầu của bạn
        const response = await api.get('/conversations', { params });
        return response.data;
    },

    async getTopics() {
        return (await api.get('/conversations/topics')).data;
    },

    async getLevels() {
        return (await api.get('/conversations/levels')).data;
    },

    async getConfig() {
        return (await api.get('/conversations/config')).data;
    },

    async incrementUsage(conversationId) {
        return (await api.post(`/conversations/${conversationId}/use`)).data;
    },

    /**
     * ==================== 2. GỌI AI TỪ PYTHON (Để chấm điểm) ====================
     */
    async evaluatePronunciation(formData) {
        // Gọi thẳng sang Python (Cổng 8000) - KHÔNG có dấu / ở đầu realtime
        const response = await pythonApi.post('realtime/pronunciation', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    /**
     * ==================== 3. XỬ LÝ AUDIO & WEBSOCKET ====================
     */
    getAudioUrl(conversationId, filename) {
        if (!conversationId || !filename) return null;
        if (filename.startsWith('http://') || filename.startsWith('https://')) {
            return filename;
        }
        const baseUrl = process.env.REACT_APP_PYTHON_API_URL ? `${process.env.REACT_APP_PYTHON_API_URL}/api/v1` : 'http://localhost:8000/api/v1';
        // Extract only the raw filename (e.g. line_1_xxx.mp3)
        const cleanName = filename.split('/').filter(Boolean).pop();
        return `${baseUrl}/conversation/audio/${conversationId}/${cleanName}`;
    },

    createWebSocketConnection(connectionId) {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        let wsBase = '';
        
        if (process.env.REACT_APP_PYTHON_WS_URL) {
            wsBase = process.env.REACT_APP_PYTHON_WS_URL.replace(/\/$/, '');
        } else if (isLocal) {
            wsBase = 'ws://localhost:8000';
        } else if (process.env.REACT_APP_PYTHON_API_URL) {
            wsBase = process.env.REACT_APP_PYTHON_API_URL.replace(/\/$/, '').replace(/^http/, 'ws');
        } else {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            wsBase = `${protocol}//${window.location.host}`;
        }
        return new WebSocket(`${wsBase}/ws/conversation/${connectionId}`);
    },

    WS_RESPONSE_TYPES: {
        AI_RESPONSE: 'ai_response',
        ERROR: 'error',
        CONNECTION_ESTABLISHED: 'connection_established',
        CONVERSATION_STARTED: 'conversation_started',
    }
};

export default conversationService;