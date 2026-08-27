import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { conversationService } from '../services/conversationService';
import { message } from 'antd';

/**
 * Custom hook để quản lý conversation practice
 * Tích hợp với WebSocket và REST API
 * Đồng bộ hoàn toàn với backend Node.js
 */
export const useConversation = () => {
    const { user } = useSelector((state) => state.auth);
    const [isConnected, setIsConnected] = useState(false);
    const [currentSession, setCurrentSession] = useState(null);
    const [conversationMessages, setConversationMessages] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isAITyping, setIsAITyping] = useState(false);
    const [currentScenario, setCurrentScenario] = useState(null);
    const [scenarios, setScenarios] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Dynamic data từ backend
    const [topics, setTopics] = useState([]);
    const [levels, setLevels] = useState([]);
    const [config, setConfig] = useState(null);
    const [voices, setVoices] = useState(null);
    const [loadingMeta, setLoadingMeta] = useState(false);

    const wsRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const connectionIdRef = useRef(null);
    const pingIntervalRef = useRef(null);

    /**
     * Tạo connection ID duy nhất
     */
    const generateConnectionId = () => {
        return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const reconnectTimerRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;

    /**
     * Kết nối WebSocket với cơ chế tự động kết nối lại thông minh
     */
    const connectWebSocket = useCallback(() => {
        if (!user?.id) return;

        // Xóa connection cũ nếu đang mở
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const connectionId = generateConnectionId();
        connectionIdRef.current = connectionId;

        try {
            const ws = conversationService.createWebSocketConnection(connectionId);
            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;
                console.log('✅ WebSocket connected successfully');

                // Heartbeat ping every 15s to keep connection alive
                if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        try {
                            ws.send(JSON.stringify({ type: 'ping' }));
                        } catch (e) {
                            console.warn('Ping failed:', e);
                        }
                    }
                }, 15000);
            };

            ws.onmessage = (event) => {
                let data;
                try {
                    data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                } catch (error) {
                    return;
                }

                if (data && data.type === 'pong') {
                    return; // Heartbeat pong response
                }

                if (data && data.error) {
                    console.warn("Lỗi từ AI Server:", data.error);
                    return;
                }

                handleWebSocketMessage(data);
            };

            ws.onerror = (error) => {
                console.warn('WebSocket connection attempt failed, will retry in background...');
                setIsConnected(false);
            };

            ws.onclose = () => {
                if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
                setIsConnected(false);

                // Tự động kết nối lại sau 2s, 4s, 8s nếu chưa vượt quá số lần tối đa
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
                    reconnectAttemptsRef.current += 1;
                    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
                    reconnectTimerRef.current = setTimeout(() => {
                        console.log(`🔄 Retrying WebSocket connection (Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
                        connectWebSocket();
                    }, delay);
                }
            };
        } catch (error) {
            console.warn('Failed to initialize WebSocket:', error);
            setIsConnected(false);
        }
    }, [user]);

    /**
     * Xử lý WebSocket messages
     */
    const handleWebSocketMessage = (data) => {
        const { type } = data;

        switch (type) {
            case conversationService.WS_RESPONSE_TYPES.CONNECTION_ESTABLISHED:
                console.log('Connection established:', data.connection_id);
                break;

            case conversationService.WS_RESPONSE_TYPES.CONVERSATION_STARTED:
                setCurrentSession(data.session_id);
                setCurrentScenario(data.scenario);
                if (data.scenario?.sample_conversation) {
                    setConversationMessages(data.scenario.sample_conversation);
                }
                message.success('Bắt đầu hội thoại thành công!');
                break;

            case conversationService.WS_RESPONSE_TYPES.CONVERSATION_MESSAGE:
                // Ensure message has correct format
                const msg = data.message || data;
                const formattedMsg = {
                    id: msg.id || `msg_${Date.now()}`,
                    speaker: msg.speaker || 'ai',
                    message: msg.message || msg.content || '',
                    audio_url: msg.audio_url,
                    order: msg.order || conversationMessages.length + 1
                };
                setConversationMessages(prev => [...prev, formattedMsg]);
                break;

            case conversationService.WS_RESPONSE_TYPES.AI_RESPONSE:
                setIsAITyping(false);
                // Convert message object to ConversationMessage format
                const aiMsg = data.message || data;
                const aiMessage = {
                    id: aiMsg.id || `msg_${Date.now()}`,
                    speaker: aiMsg.speaker || currentScenario?.ai_character_name || 'ai',
                    message: aiMsg.message || aiMsg.content || '',
                    audio_url: aiMsg.audio_url,
                    order: aiMsg.order || conversationMessages.length + 1
                };
                setConversationMessages(prev => [...prev, aiMessage]);
                // Play audio if available
                if (aiMessage.audio_url) {
                    playAudio(aiMessage.audio_url);
                }
                break;

            case conversationService.WS_RESPONSE_TYPES.AI_TYPING:
                setIsAITyping(true);
                break;

            case conversationService.WS_RESPONSE_TYPES.TRANSCRIPT:
                // Show transcript to user
                console.log('Transcript:', data.text);
                break;

            case conversationService.WS_RESPONSE_TYPES.AI_INTERRUPTED:
                message.info('AI đã dừng nói');
                break;

            case conversationService.WS_RESPONSE_TYPES.CONVERSATION_ENDED:
                message.success('Hội thoại đã kết thúc');
                setCurrentSession(null);
                setCurrentScenario(null);
                break;

            case conversationService.WS_RESPONSE_TYPES.ERROR:
                message.error(data.message || 'Có lỗi xảy ra');
                setIsAITyping(false);
                break;

            default:
                console.log('Unknown message type:', type);
        }
    };

    /**
     * Phát audio - sử dụng helper từ conversationService
     */
    const playAudio = (audioUrl) => {
        const fullUrl = conversationService.getFullAudioUrl(audioUrl);
        if (!fullUrl) {
            console.warn('No audio URL provided');
            return;
        }

        const audio = new Audio(fullUrl);
        audio.play().catch(err => {
            console.error('Failed to play audio:', err);
        });
    };

    /**
     * Bắt đầu conversation
     */
    const startConversation = useCallback(async (scenarioId) => {
        if (!isConnected || !wsRef.current) {
            message.error('Chưa kết nối với server');
            return;
        }

        if (!user?.id) {
            message.error('Vui lòng đăng nhập');
            return;
        }

        try {
            const message = {
                type: conversationService.WS_MESSAGE_TYPES.START_CONVERSATION,
                scenario_id: scenarioId,
                user_id: user.id
            };

            wsRef.current.send(JSON.stringify(message));
        } catch (error) {
            console.error('Failed to start conversation:', error);
            message.error('Không thể bắt đầu hội thoại');
        }
    }, [isConnected, user]);

    /**
     * Gửi text message
     */
    const sendTextMessage = useCallback((text) => {
        if (!currentSession || !wsRef.current) {
            message.error('Chưa có session đang hoạt động');
            return;
        }

        try {
            const message = {
                type: conversationService.WS_MESSAGE_TYPES.SEND_MESSAGE,
                session_id: currentSession,
                text: text
            };

            wsRef.current.send(JSON.stringify(message));
            setIsAITyping(true);
        } catch (error) {
            console.error('Failed to send message:', error);
            message.error('Không thể gửi tin nhắn');
        }
    }, [currentSession]);

    /**
     * Bắt đầu ghi âm
     */
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                await sendAudioMessage(audioBlob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Failed to start recording:', error);
            message.error('Không thể truy cập microphone');
        }
    }, []);

    /**
     * Dừng ghi âm
     */
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    /**
     * Gửi audio message
     */
    const sendAudioMessage = useCallback(async (audioBlob) => {
        if (!currentSession || !wsRef.current) {
            message.error('Chưa có session đang hoạt động');
            return;
        }

        try {
            // Convert blob to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Audio = reader.result.split(',')[1];

                const message = {
                    type: conversationService.WS_MESSAGE_TYPES.SEND_AUDIO,
                    session_id: currentSession,
                    audio: base64Audio
                };

                wsRef.current.send(JSON.stringify(message));
                setIsAITyping(true);
            };
            reader.readAsDataURL(audioBlob);
        } catch (error) {
            console.error('Failed to send audio:', error);
            message.error('Không thể gửi audio');
        }
    }, [currentSession]);

    /**
     * Interrupt AI
     */
    const interruptAI = useCallback(() => {
        if (!currentSession || !wsRef.current) {
            return;
        }

        try {
            const message = {
                type: conversationService.WS_MESSAGE_TYPES.INTERRUPT_AI,
                session_id: currentSession
            };

            wsRef.current.send(JSON.stringify(message));
        } catch (error) {
            console.error('Failed to interrupt AI:', error);
        }
    }, [currentSession]);

    /**
     * Kết thúc conversation
     */
    const endConversation = useCallback(() => {
        if (!currentSession || !wsRef.current) {
            return;
        }

        try {
            const message = {
                type: conversationService.WS_MESSAGE_TYPES.END_CONVERSATION,
                session_id: currentSession
            };

            wsRef.current.send(JSON.stringify(message));
        } catch (error) {
            console.error('Failed to end conversation:', error);
        }
    }, [currentSession]);

    /**
     * Load conversations từ Node.js API (có audio)
     */
    const loadScenarios = useCallback(async (filters = {}) => {
        setLoading(true);
        try {
            // Sử dụng Node.js API để lấy conversations có audio
            const response = await conversationService.getConversationsWithAudio(filters, { limit: 100 });

            if (response && response.success && response.data) {
                // Map Node.js conversation format sang format dùng trong component
                const mappedScenarios = response.data.map(conv => ({
                    id: conv._id,
                    title: conv.title,
                    description: conv.description,
                    topic: conv.topic,
                    level: conv.level,
                    is_active: conv.isActive,
                    participants: conv.participants,
                    lines: conv.lines, // Bao gồm audioUrl cho từng line
                    totalLines: conv.totalLines,
                    tags: conv.tags,
                    difficulty: conv.difficulty,
                    duration: conv.duration,
                    usageCount: conv.usageCount,
                    // Audio info
                    audioGenerationStatus: conv.audioGenerationStatus,
                    audioGenerationProgress: conv.audioGenerationProgress,
                    hasAudio: conv.audioGenerationStatus === 'completed' || conv.audioGenerationProgress > 0,
                    // Mapping thêm để tương thích
                    ai_character_name: conv.participants?.[0]?.name || 'AI',
                    sample_conversation: conv.lines?.map((line, idx) => ({
                        id: line._id || `line_${idx}`,
                        speaker: line.speaker,
                        speakerName: line.speakerName,
                        content: line.content,
                        message: line.content,
                        translation: line.translation,
                        audio_url: line.audioUrl,
                        audioUrl: line.audioUrl,
                        audioStatus: line.audioStatus,
                        order: line.order || idx + 1
                    })),
                    key_vocabulary: conv.tags,
                    learning_objectives: conv.description ? [conv.description] : [],
                    voiceSettings: conv.voiceSettings,
                    createdAt: conv.createdAt,
                    updatedAt: conv.updatedAt
                }));

                setScenarios(mappedScenarios);
            } else if (Array.isArray(response)) {
                setScenarios(response);
            } else {
                setScenarios([]);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
            message.error('Không thể tải danh sách hội thoại');
            setScenarios([]);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Load topics từ backend
     * Topics được lấy động từ database - danh sách các topic có trong conversations
     */
    const loadTopics = useCallback(async () => {
        try {
            const response = await conversationService.getTopics();
            if (response && response.success && response.data) {
                setTopics(response.data);
            }
        } catch (error) {
            console.error('Failed to load topics:', error);
            // Không hiện message error vì đây là metadata
        }
    }, []);

    /**
     * Load levels từ backend
     * Levels là enum cố định từ backend
     */
    const loadLevels = useCallback(async () => {
        try {
            const response = await conversationService.getLevels();
            if (response && response.success && response.data) {
                setLevels(response.data);
            }
        } catch (error) {
            console.error('Failed to load levels:', error);
        }
    }, []);

    /**
     * Load config từ backend
     * Config chứa các giới hạn như minLines, maxLines, minParticipants, maxParticipants
     */
    const loadConfig = useCallback(async () => {
        try {
            const response = await conversationService.getConfig();
            if (response && response.success && response.data) {
                setConfig(response.data);
            }
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    }, []);

    /**
     * Load available voices từ backend
     */
    const loadVoices = useCallback(async () => {
        try {
            const response = await conversationService.getVoicesFromBackend();
            if (response && response.success && response.data) {
                setVoices(response.data);
            }
        } catch (error) {
            console.error('Failed to load voices:', error);
        }
    }, []);

    /**
     * Load tất cả metadata từ backend (topics, levels, config, voices)
     * Gọi một lần khi component mount
     */
    const loadMetadata = useCallback(async () => {
        setLoadingMeta(true);
        try {
            await Promise.all([
                loadTopics(),
                loadLevels(),
                loadConfig(),
                loadVoices()
            ]);
        } catch (error) {
            console.error('Failed to load metadata:', error);
        } finally {
            setLoadingMeta(false);
        }
    }, [loadTopics, loadLevels, loadConfig, loadVoices]);

    /**
     * Cleanup khi unmount
     */
    useEffect(() => {
        return () => {
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stop();
            }
        };
    }, [isRecording]);

    return {
        // State
        isConnected,
        currentSession,
        conversationMessages,
        isRecording,
        isAITyping,
        currentScenario,
        scenarios,
        loading,
        
        // Dynamic metadata từ backend
        topics,
        levels,
        config,
        voices,
        loadingMeta,

        // Actions
        connectWebSocket,
        startConversation,
        sendTextMessage,
        startRecording,
        stopRecording,
        interruptAI,
        endConversation,
        loadScenarios,
        
        // Metadata actions
        loadTopics,
        loadLevels,
        loadConfig,
        loadVoices,
        loadMetadata,
    };
};
