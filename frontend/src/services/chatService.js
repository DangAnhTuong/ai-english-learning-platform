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
     * Gửi tin nhắn và nhận stream phản hồi từ AI (SSE)
     * @param {string} message - Tin nhắn của user
     * @param {Array} conversationHistory - Lịch sử
     * @param {function} onChunk - Callback gọi khi có chữ mới
     */
    async streamMessage(message, conversationHistory = [], onChunk) {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${PYTHON_API_URL}/api/v1/realtime/chat_stream`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    message,
                    conversation_history: conversationHistory
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    const chunkStr = decoder.decode(value, { stream: true });
                    const lines = chunkStr.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.content) {
                                    onChunk(data.content);
                                }
                            } catch (e) {
                                console.error('Lỗi parse SSE chunk:', e);
                            }
                        }
                    }
                }
            }
            return { success: true };
        } catch (error) {
            console.error('Chat stream API error:', error);
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
    async generateTTS(text, voice = 'shimmer', localTtsUrl = '') {
        // Ưu tiên sử dụng Supertonic (Kokoro TTS) Local
        if (localTtsUrl && localTtsUrl.trim() !== '') {
            try {
                const supertonicVoice = voice === 'shimmer' ? 'af_bella' : 'am_adam';
                const res = await fetch(localTtsUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: "kokoro",
                        input: text,
                        voice: supertonicVoice,
                        response_format: "mp3"
                    })
                });
                if (res.ok) {
                    return await res.blob();
                } else {
                    console.warn("Lỗi Supertonic TTS:", await res.text());
                }
            } catch (e) {
                console.warn("Không kết nối được Supertonic/Kokoro Local, chuyển về server TTS...", e);
            }
        }

        try {
            const response = await fetch(`${PYTHON_API_URL}/api/v1/tts/generate`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...getAuthHeaders() // Phải có Token thì Python mới cho đọc
                },
                body: JSON.stringify({ text, voice }),
            });

            if (!response.ok) throw new Error('Server Python từ chối tạo giọng nói');
            return await response.blob();
        } catch (error) {
            console.error('Lỗi TTS:', error);
            return null;
        }
    },

    /**
     * Tra cứu từ vựng tiếng Anh
     */
    async lookupWord(word) {
        try {
            const data = await request('/api/v1/realtime/lookup', {
                method: 'POST',
                body: { word }
            });
            return { success: true, data };
        } catch (error) {
            console.error('Lookup API error:', error);
            return {
                success: false,
                data: {
                    word: word,
                    ipa: '',
                    type: 'word',
                    meaning: `Từ: ${word}`,
                    example: ''
                }
            };
        }
    },

    /**
     * Lấy gợi ý phản xạ nhanh theo ngữ cảnh
     */
    async getQuickSuggestions(lastAiMessage, conversationHistory = []) {
        try {
            const data = await request('/api/v1/realtime/suggestions', {
                method: 'POST',
                body: {
                    last_ai_message: lastAiMessage,
                    conversation_history: conversationHistory.slice(-6)
                }
            });
            return { success: true, suggestions: data.suggestions || [] };
        } catch (error) {
            console.error('Suggestions API error:', error);
            return { 
                success: false, 
                suggestions: [
                    "Could you explain more about that?",
                    "That sounds very interesting!",
                    "How do I say this correctly?"
                ] 
            };
        }
    },

    /**
     * Dịch nhanh văn bản sang tiếng Việt
     */
    async translateText(text, targetLang = 'vi') {
        try {
            const data = await request('/api/v1/realtime/translate', {
                method: 'POST',
                body: { text, target_lang: targetLang }
            });
            return { success: true, translation: data.translation };
        } catch (error) {
            console.error('Translate API error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Kiểm tra trạng thái service
     */
    async healthCheck() {
        try {
            // Sử dụng link health check tổng quát có trong OAS
            const data = await request('/health'); 
            return { success: true, status: data.status };
        } catch (error) {
            console.error('Health check error:', error);
            return { success: false, error: error.message };
        }
    }
};

export default chatService;
