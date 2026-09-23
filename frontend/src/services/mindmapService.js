import api from './api';

// Python API base URL
const isLocalMM = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const PYTHON_API_URL = isLocalMM ? (process.env.REACT_APP_PYTHON_API_URL && process.env.REACT_APP_PYTHON_API_URL.startsWith('http') ? process.env.REACT_APP_PYTHON_API_URL : 'http://localhost:8000') : '/py-api';

/**
 * Mindmap Service
 * Xử lý API calls cho Mindmap và tra từ điển
 */

export const mindmapService = {
    /**
     * Generate mindmap từ topic bằng AI
     * @param {string} topic - Chủ đề cần generate mindmap
     */
        async generateMindmap(topic) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 12s timeout
        try {
            const response = await fetch(`${PYTHON_API_URL}/api/v1/mindmap/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ topic }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            clearTimeout(timeoutId);
            console.warn('Generate mindmap fetch error or timeout:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Tra từ vựng từ database (Node.js API)
     * @param {string} word - Từ cần tra
     */
    async searchVocabulary(word) {
        try {
            const response = await api.get('/vocabulary/search', {
                params: { q: word, limit: 1 }
            });
            return response.data;
        } catch (error) {
            console.error('Search vocabulary error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Lấy danh sách từ vựng theo topic
     * @param {string} topic - Chủ đề
     * @param {Object} options - { page, limit }
     */
    async getVocabularyByTopic(topic, options = {}) {
        try {
            const response = await api.get('/vocabulary', {
                params: {
                    topic,
                    page: options.page || 1,
                    limit: options.limit || 20
                }
            });
            return response.data;
        } catch (error) {
            console.error('Get vocabulary by topic error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Lấy chi tiết một từ vựng
     * @param {string} id - ID của từ vựng
     */
    async getVocabularyById(id) {
        try {
            const response = await api.get(`/vocabulary/${id}`);
            return response.data;
        } catch (error) {
            console.error('Get vocabulary by ID error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Lấy danh sách word types
     */
    async getWordTypes() {
        try {
            const response = await api.get('/vocabulary/types');
            return response.data;
        } catch (error) {
            console.error('Get word types error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Lấy danh sách levels
     */
    async getLevels() {
        try {
            const response = await api.get('/vocabulary/levels');
            return response.data;
        } catch (error) {
            console.error('Get levels error:', error);
            return { success: false, error: error.message };
        }
    }
};

export default mindmapService;
