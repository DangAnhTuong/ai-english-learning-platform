const axios = require('axios');
const AppError = require('../utils/AppError');
const Logger = require('../utils/logger');

class ConversationAudioService {
    /**
     * Gọi Python API để generate audio cho conversation
     * @param {string} conversationId - ID conversation
     * @param {Array} lines - Danh sách lines cần generate audio
     * @param {Object} voiceSettings - Voice settings
     * @returns {Promise<Object>} Kết quả generate audio
     */
    static async generateAudio(conversationId, lines, voiceSettings) {
        try {
            const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
            
            Logger.info(`Calling Python API to generate audio for conversation: ${conversationId}`);
            
            const response = await axios.post(
                `${pythonApiUrl}/api/v1/conversation/generate-audio`,
                {
                    conversation_id: conversationId,
                    lines: lines.map(line => ({
                        _id: line._id.toString(),
                        content: line.content,
                        speaker: line.speaker,
                        order: line.order
                    })),
                    voice_settings: voiceSettings || {
                        speakerA: {
                            provider: 'openai',
                            voice: 'alloy',
                            speed: 1.0
                        }
                    }
                },
                {
                    timeout: 300000, // 5 minutes timeout cho việc generate audio
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            Logger.info(`Audio generation completed for conversation: ${conversationId}`);
            
            return {
                success: true,
                total_lines: response.data.total_lines || 0,
                generated: response.data.generated || 0,
                failed: response.data.failed || 0,
                audio_urls: response.data.audio_urls || {},
                metadata: response.data.metadata || {}
            };
            
        } catch (error) {
            Logger.error(`Failed to generate audio for conversation ${conversationId}:`, error.message);
            
            // Xử lý các loại lỗi khác nhau
            if (error.code === 'ECONNREFUSED') {
                throw new AppError(
                    'Không thể kết nối đến Python API service',
                    503,
                    'PYTHON_API_UNAVAILABLE'
                );
            }
            
            if (error.code === 'ETIMEDOUT' || error.response?.status === 504) {
                throw new AppError(
                    'Generate audio timeout. Vui lòng thử lại sau',
                    504,
                    'AUDIO_GENERATION_TIMEOUT'
                );
            }
            
            if (error.response?.data?.detail) {
                throw new AppError(
                    `Generate audio thất bại: ${error.response.data.detail}`,
                    error.response.status || 500,
                    'AUDIO_GENERATION_FAILED'
                );
            }
            
            throw new AppError(
                `Generate audio thất bại: ${error.message}`,
                500,
                'AUDIO_GENERATION_FAILED'
            );
        }
    }
    
    /**
     * Kiểm tra Python API có sẵn sàng không
     * @returns {Promise<boolean>}
     */
    static async checkPythonApiHealth() {
        try {
            const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
            const response = await axios.get(`${pythonApiUrl}/health`, {
                timeout: 5000
            });
            return response.status === 200;
        } catch (error) {
            Logger.warn('Python API health check failed:', error.message);
            return false;
        }
    }
}

module.exports = ConversationAudioService;

