/**
 * Chat Service
 * Xử lý API calls cho AI Chatbox
 */

// Python API base URL
const PYTHON_API_URL = (process.env.REACT_APP_PYTHON_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const NODE_API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '');

const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    const response = await fetch(`${NODE_API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;
    const payload = await response.json();
    const tokens = payload?.data || {};
    if (!tokens.accessToken) return null;

    localStorage.setItem('accessToken', tokens.accessToken);
    if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken);
    }
    return tokens.accessToken;
};

const request = async (path, { method = 'GET', body, isFormData = false, _retried = false } = {}) => {
    const headers = {
        ...getAuthHeaders(),
    };

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${PYTHON_API_URL}${path}`, {
        method,
        headers,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });

    if (response.status === 401 && !_retried) {
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
            return request(path, { method, body, isFormData, _retried: true });
        }
    }

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorPayload = await response.json();
            errorMessage = errorPayload?.message || errorPayload?.error || errorMessage;
        } catch (_e) {
            // fallback to default message when response is not JSON
        }
        throw new Error(errorMessage);
    }

    return response.json();
};

export const chatService = {
    /**
     * Gửi tin nhắn và nhận phản hồi từ AI
     * @param {string} message - Tin nhắn của user
     * @param {Array} conversationHistory - Lịch sử hội thoại
     */
    async sendMessage(message, conversationHistory = []) {
        try {
            const data = await request('/api/v1/realtime/chat', {
                method: 'POST',
                body: {
                    message,
                    conversation_history: conversationHistory
                }
            });
            return { success: true, response: data.response };
        } catch (error) {
            console.error('Chat API error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Transcribe audio bằng Whisper
     * @param {Blob} audioBlob - Audio file blob
     */
    async transcribeAudio(audioBlob) {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.webm');

            const data = await request('/api/v1/realtime/whisper', {
                method: 'POST',
                body: formData,
                isFormData: true,
            });
            return {
                success: true,
                transcript: data.transcript,
                confidence: data.confidence,
                language: data.language
            };
        } catch (error) {
            console.error('Transcribe API error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Lấy phản hồi feedback phát âm
     * @param {string} expected - Text mong đợi
     * @param {string} transcript - Text user đọc
     */
    async getPronunciationFeedback(expected, transcript) {
        try {
            const data = await request('/api/v1/realtime/feedback', {
                method: 'POST',
                body: { expected, transcript },
            });
            return { success: true, feedback: data.feedback };
        } catch (error) {
            console.error('Feedback API error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Xóa lịch sử hội thoại
     */
    async clearConversation() {
        try {
            await request('/api/v1/realtime/clear', {
                method: 'POST',
            });

            return { success: true };
        } catch (error) {
            console.error('Clear conversation error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Kiểm tra trạng thái service
     */
    async healthCheck() {
        try {
            const data = await request('/api/v1/realtime/health');
            return { success: true, status: data.status };
        } catch (error) {
            console.error('Health check error:', error);
            return { success: false, error: error.message };
        }
    }
};

export default chatService;
