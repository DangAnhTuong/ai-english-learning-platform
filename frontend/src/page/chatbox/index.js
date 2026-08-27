import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input, Button, Avatar, Tooltip, message, Alert, Select, Switch } from 'antd';
import { 
    SendOutlined, AudioOutlined, RobotOutlined, UserOutlined, 
    ClearOutlined, LoadingOutlined, StopOutlined, SoundOutlined,
    TranslationOutlined, CopyOutlined, CheckOutlined, ThunderboltOutlined,
    CustomerServiceOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { chatService } from '../../services/chatService';
import WordLookupPopover from '../../components/WordLookupPopover';
import SmartSuggestions from '../../components/SmartSuggestions';
import './style.css';

const { Option } = Select;

const WELCOME_MSG = {
    id: 1,
    sender: 'ai',
    text: "Hi there! I'm your English AI Assistant. We can practice daily conversation, talk about any topic, or I can help correct your grammar. What would you like to discuss today?",
    translation: "Chào bạn! Mình là Trợ lý AI tiếng Anh. Chúng ta có thể luyện hội thoại hàng ngày, trò chuyện về bất kỳ chủ đề nào, hoặc mình có thể giúp bạn sửa ngữ pháp. Hôm nay bạn muốn thảo luận về điều gì?"
};

function Chatbox() {
    const { isLogin } = useSelector((state) => state.auth);
    const [messages, setMessages] = useState([WELCOME_MSG]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [selectedVoice, setSelectedVoice] = useState('female');
    const [isHandsFree, setIsHandsFree] = useState(false); // ChatGPT Voice Mode
    const [translations, setTranslations] = useState({ 1: WELCOME_MSG.translation });
    const [translatingIds, setTranslatingIds] = useState({});
    const [copiedId, setCopiedId] = useState(null);
    const [playingMessageId, setPlayingMessageId] = useState(null);
    const [aiIsSpeaking, setAiIsSpeaking] = useState(false);

    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const isHandsFreeRef = useRef(isHandsFree);
    const isTypingRef = useRef(isTyping);
    const aiIsSpeakingRef = useRef(aiIsSpeaking);
    const lastSpokenTextRef = useRef('');

    useEffect(() => {
        isHandsFreeRef.current = isHandsFree;
    }, [isHandsFree]);

    useEffect(() => {
        isTypingRef.current = isTyping;
    }, [isTyping]);

    useEffect(() => {
        aiIsSpeakingRef.current = aiIsSpeaking;
    }, [aiIsSpeaking]);

    useEffect(() => {
        checkServiceHealth();
        return () => {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (e) {}
            }
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const checkServiceHealth = async () => {
        const result = await chatService.healthCheck();
        setIsOnline(result.success);
    };

    // Lấy tin nhắn AI gần nhất để sinh gợi ý phản xạ
    const lastAiMessage = [...messages].reverse().find(m => m.sender === 'ai' && m.text && !m.isError)?.text || '';

    /**
     * Native Web Speech Synthesis - Phát âm thanh tức thì (0ms latency)
     */
    const speakTextInstant = useCallback((text, voiceType = selectedVoice, onFinishCallback = null) => {
        if (!('speechSynthesis' in window) || !text) {
            if (onFinishCallback) onFinishCallback();
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.95;
        utterance.pitch = voiceType === 'female' ? 1.1 : 0.9;

        // Chọn giọng đọc native tốt nhất
        const voices = window.speechSynthesis.getVoices();
        const enVoices = voices.filter(v => v.lang.startsWith('en'));
        if (enVoices.length > 0) {
            if (voiceType === 'female') {
                const femaleVoice = enVoices.find(v => /female|zira|samantha|victoria|karen|susan|google us english/i.test(v.name));
                if (femaleVoice) utterance.voice = femaleVoice;
            } else {
                const maleVoice = enVoices.find(v => /male|david|daniel|george|alex/i.test(v.name));
                if (maleVoice) utterance.voice = maleVoice;
            }
        }

        utterance.onstart = () => {
            setAiIsSpeaking(true);
        };

        utterance.onend = () => {
            setPlayingMessageId(null);
            setAiIsSpeaking(false);
            if (onFinishCallback) onFinishCallback();
        };

        utterance.onerror = () => {
            setPlayingMessageId(null);
            setAiIsSpeaking(false);
            if (onFinishCallback) onFinishCallback();
        };

        window.speechSynthesis.speak(utterance);
    }, [selectedVoice]);

    /**
     * Native Web Speech Recognition - Nhận diện giọng nói tức thì (0ms)
     */
    const startListening = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            message.warning('Trình duyệt không hỗ trợ Web Speech Recognition. Vui lòng dùng Google Chrome hoặc Microsoft Edge.');
            return;
        }

        // Barge-in: Nếu AI đang nói thì ngắt ngay
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setAiIsSpeaking(false);
        }

        try {
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (e) {}
            }

            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;
            lastSpokenTextRef.current = '';

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onresult = (event) => {
                let fullFinal = '';
                let fullInterim = '';

                // Duyệt qua toàn bộ kết quả từ đầu session để không bao giờ bị mất chữ hoặc đứt câu
                for (let i = 0; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        fullFinal += event.results[i][0].transcript + ' ';
                    } else {
                        fullInterim += event.results[i][0].transcript;
                    }
                }

                const fullTranscript = (fullFinal + fullInterim).replace(/\s+/g, ' ').trim();
                if (fullTranscript) {
                    lastSpokenTextRef.current = fullTranscript;
                    setInputValue(fullTranscript);

                    // Xóa timer cũ mỗi khi người dùng tiếp tục phát âm
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                    }

                    // Chỉ tự động gửi khi người dùng thực sự hoàn thành câu và im lặng đủ 2.2 giây
                    silenceTimerRef.current = setTimeout(() => {
                        const finalSpoken = lastSpokenTextRef.current.trim();
                        if (finalSpoken && finalSpoken.length >= 2) {
                            stopListening();
                            executeSend(finalSpoken);
                        }
                    }, 2200);
                }
            };

            recognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
                if (event.error !== 'no-speech') {
                    setIsListening(false);
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (error) {
            console.error('Recognition error:', error);
            setIsListening(false);
        }
    }, []);

    const stopListening = useCallback(() => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        if (recognitionRef.current) {
            try { 
                recognitionRef.current.stop(); 
            } catch(e) {}
        }
        setIsListening(false);
    }, []);

    const executeSend = async (userMessage) => {
        if (!userMessage || !userMessage.trim()) return;

        // Dừng nghe và xóa timer / buffer để tránh gửi lặp lại
        stopListening();
        lastSpokenTextRef.current = '';

        const cleanText = userMessage.trim();
        const userMsgId = Date.now();

        // 1. Optimistic UI update for user message
        const newUserMsg = {
            id: userMsgId,
            sender: 'user',
            text: cleanText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        setIsTyping(true);

        // 2. Sliding window context (last 8 messages)
        const conversationHistory = messages.slice(-8).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        }));

        const aiMsgId = Date.now() + 1;
        setMessages(prev => [...prev, { 
            id: aiMsgId, 
            sender: 'ai', 
            text: '', 
            isError: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        let currentText = '';

        try {
            await chatService.streamMessage(cleanText, conversationHistory, (chunk) => {
                currentText += chunk;
                setMessages(prev => prev.map(msg =>
                    msg.id === aiMsgId ? { ...msg, text: currentText } : msg
                ));
            });

            setIsTyping(false);

            // Tự động phát âm thanh
            if (currentText.trim()) {
                speakTextInstant(currentText.trim(), selectedVoice, () => {
                    // Nếu đang bật Chế độ Rảnh tay ChatGPT, tự động mở Mic nghe tiếp lượt của user!
                    if (isHandsFreeRef.current) {
                        setTimeout(() => {
                            startListening();
                        }, 300);
                    }
                });
            }

        } catch (error) {
            console.error('Chat error:', error);
            const fallbackReply = generateFallbackResponse(cleanText);
            setMessages(prev => prev.map(msg =>
                msg.id === aiMsgId ? { ...msg, text: fallbackReply, isError: false } : msg
            ));
            setIsTyping(false);
            speakTextInstant(fallbackReply, selectedVoice, () => {
                if (isHandsFreeRef.current) {
                    setTimeout(() => startListening(), 300);
                }
            });
        }
    };

    const handleSend = () => {
        executeSend(inputValue);
    };

    const handleTranslateMessage = async (msgId, text) => {
        if (translations[msgId]) {
            setTranslations(prev => {
                const next = { ...prev };
                delete next[msgId];
                return next;
            });
            return;
        }

        setTranslatingIds(prev => ({ ...prev, [msgId]: true }));
        try {
            const res = await chatService.translateText(text, 'vi');
            if (res && res.translation) {
                setTranslations(prev => ({ ...prev, [msgId]: res.translation }));
            } else {
                message.error('Không thể dịch lúc này');
            }
        } catch (e) {
            message.error('Lỗi khi dịch câu');
        } finally {
            setTranslatingIds(prev => ({ ...prev, [msgId]: false }));
        }
    };

    const handlePlayMessageTTS = (msgId, text) => {
        if (playingMessageId === msgId) {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            setPlayingMessageId(null);
            setAiIsSpeaking(false);
            return;
        }

        setPlayingMessageId(msgId);
        speakTextInstant(text, selectedVoice);
    };

    const handleCopy = (msgId, text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(msgId);
        message.success('Đã sao chép văn bản');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const generateFallbackResponse = (userText) => {
        const lower = userText.toLowerCase();
        if (lower.includes('example') || lower.includes('ví dụ')) {
            return "Sure! For example: 'Could I please get a table for two near the window?' You can use this polite phrase whenever you arrive at a restaurant. How would you order a beverage next?";
        }
        if (lower.includes('hello') || lower.includes('hi') || lower.includes('xin chào')) {
            return "Hello! How are you doing today? I'm excited to practice English with you! What would you like to talk about: food, travel, or hobbies?";
        }
        if (lower.includes('order') || lower.includes('food') || lower.includes('restaurant')) {
            return "Ordering food is great practice! What would you like to order? For example, you can say: 'I'd like to order a grilled chicken sandwich.'";
        }
        if (lower.includes('thank') || lower.includes('cảm ơn')) {
            return "You're very welcome! Keep practicing every day to improve your fluency!";
        }
        return `That's great! Let's talk more about "${userText}". How do you feel about this topic?`;
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
            if (inputValue.trim()) {
                executeSend(inputValue.trim());
            }
        } else {
            startListening();
        }
    };

    const toggleHandsFree = (checked) => {
        setIsHandsFree(checked);
        if (checked) {
            message.success('Đã kích hoạt Chế độ Đàm thoại ChatGPT! Hãy bắt đầu nói tiếng Anh liên tục.', 3);
            startListening();
        } else {
            stopListening();
            message.info('Đã tắt Chế độ Đàm thoại rảnh tay.');
        }
    };

    const handleClearChat = async () => {
        setMessages([WELCOME_MSG]);
        setTranslations({ 1: WELCOME_MSG.translation });
        await chatService.clearConversation();
        message.success('Đã làm mới cuộc hội thoại');
    };

    return (
        <div className="chatbox-page">
            <div className="chatbox-container">

                {/* --- Header --- */}
                <div className="chatbox-header" style={{ 
                    padding: '14px 20px', 
                    borderBottom: '1px solid rgba(0,0,0,0.06)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                    background: 'rgba(255,255,255,0.92)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260 }}>
                        <div style={{ position: 'relative' }}>
                            <Avatar size={42} style={{ backgroundColor: '#FF9C00', boxShadow: '0 4px 10px rgba(255,156,0,0.3)' }} icon={<RobotOutlined />} />
                            <span style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                backgroundColor: isOnline ? '#52c41a' : '#faad14',
                                border: '2px solid #fff'
                            }} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>English AI Tutor</h4>
                                <span className="speed-badge" style={{ fontSize: 11, background: '#e6f7ff', color: '#0958d9', padding: '1px 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                    <ThunderboltOutlined /> ChatGPT Voice Engine
                                </span>
                            </div>
                            <span style={{ fontSize: 12, color: '#64748b' }}>
                                Nhận diện giọng nói 0ms • Đàm thoại rảnh tay tự nhiên
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        {/* Toggle ChatGPT Voice Mode */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 8, 
                            padding: '4px 10px', 
                            background: isHandsFree ? 'rgba(110, 59, 255, 0.1)' : 'rgba(0,0,0,0.03)', 
                            borderRadius: 20,
                            border: isHandsFree ? '1px solid #6E3BFF' : '1px solid rgba(0,0,0,0.06)'
                        }}>
                            <CustomerServiceOutlined style={{ color: isHandsFree ? '#6E3BFF' : '#64748b' }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: isHandsFree ? '#6E3BFF' : '#64748b' }}>
                                Đàm thoại rảnh tay
                            </span>
                            <Switch size="small" checked={isHandsFree} onChange={toggleHandsFree} />
                        </div>

                        <Select 
                            value={selectedVoice} 
                            size="middle" 
                            style={{ minWidth: 135, width: 135 }} 
                            onChange={(val) => setSelectedVoice(val)}
                        >
                            <Option value="female">👩 Giọng Nữ</Option>
                            <Option value="male">👨 Giọng Nam</Option>
                        </Select>

                        <Tooltip title="Làm mới cuộc trò chuyện">
                            <Button 
                                type="text" 
                                shape="circle"
                                icon={<ClearOutlined />} 
                                onClick={handleClearChat} 
                                style={{ color: '#64748b' }}
                            />
                        </Tooltip>
                    </div>
                </div>

                {/* --- ChatGPT Hands-Free Active Banner --- */}
                {isHandsFree && (
                    <div className="handsfree-bar">
                        <div className="handsfree-indicator">
                            <div className={`voice-orb ${isListening ? 'listening' : aiIsSpeaking ? 'speaking' : ''}`}>
                                <SoundOutlined style={{ color: '#fff', fontSize: 14 }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                                    {isListening ? "🎙️ Đang nghe bạn nói... (Nói xong tự gửi)" : aiIsSpeaking ? "🗣️ AI đang nói trả lời..." : "⚡ Sẵn sàng trò chuyện"}
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>
                                    Bạn có thể ngắt lời AI bất kỳ lúc nào bằng cách nói vào mic.
                                </div>
                            </div>
                        </div>

                        {aiIsSpeaking && (
                            <div className="soundwave-bars">
                                <span></span><span></span><span></span><span></span>
                            </div>
                        )}
                    </div>
                )}

                {!isLogin && (
                    <Alert
                        message="Đăng nhập để lưu tiến độ học tập và mở khóa toàn bộ tính năng cao cấp"
                        type="info" showIcon closable style={{ margin: '8px 16px', borderRadius: 8 }}
                    />
                )}

                {/* --- Khu vực tin nhắn --- */}
                <div className="messages-area">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message-item ${msg.sender}`}>
                            {msg.sender === 'ai' && (
                                <Avatar size={34} icon={<RobotOutlined />} style={{ backgroundColor: '#FF9C00', flexShrink: 0 }} />
                            )}

                            <div className="bubble-wrapper">
                                <div className={`bubble ${msg.isError ? 'error' : ''}`}>
                                    <WordLookupPopover text={msg.text} />
                                </div>

                                {/* Bản dịch tiếng Việt nếu có */}
                                {translations[msg.id] && (
                                    <div className="inline-translation-box" style={{
                                        marginTop: 6,
                                        padding: '6px 12px',
                                        background: 'rgba(240, 247, 255, 0.85)',
                                        borderRadius: 8,
                                        borderLeft: '3px solid #1677ff',
                                        fontSize: 13,
                                        color: '#334155',
                                        animation: 'fadeIn 0.2s ease'
                                    }}>
                                        <div style={{ fontSize: 11, color: '#0958d9', fontWeight: 600, marginBottom: 2 }}>
                                            🇻🇳 Dịch nghĩa:
                                        </div>
                                        {translations[msg.id]}
                                    </div>
                                )}

                                {/* Message Tool actions */}
                                {msg.sender === 'ai' && msg.text && (
                                    <div className="message-actions" style={{ display: 'flex', gap: 4, marginTop: 4, opacity: 0.85 }}>
                                        <Tooltip title={playingMessageId === msg.id ? "Dừng đọc" : "Nghe cả câu (0ms)"}>
                                            <Button 
                                                size="small" 
                                                type="text" 
                                                shape="circle" 
                                                icon={<SoundOutlined style={{ color: playingMessageId === msg.id ? '#1677ff' : '#8c8c8c', fontSize: 13 }} />}
                                                onClick={() => handlePlayMessageTTS(msg.id, msg.text)}
                                            />
                                        </Tooltip>

                                        <Tooltip title={translations[msg.id] ? "Ẩn dịch" : "Dịch sang tiếng Việt"}>
                                            <Button 
                                                size="small" 
                                                type="text" 
                                                shape="circle" 
                                                loading={translatingIds[msg.id]}
                                                icon={<TranslationOutlined style={{ color: translations[msg.id] ? '#1677ff' : '#8c8c8c', fontSize: 13 }} />}
                                                onClick={() => handleTranslateMessage(msg.id, msg.text)}
                                            />
                                        </Tooltip>

                                        <Tooltip title="Sao chép">
                                            <Button 
                                                size="small" 
                                                type="text" 
                                                shape="circle" 
                                                icon={copiedId === msg.id ? <CheckOutlined style={{ color: '#52c41a', fontSize: 13 }} /> : <CopyOutlined style={{ color: '#8c8c8c', fontSize: 13 }} />}
                                                onClick={() => handleCopy(msg.id, msg.text)}
                                            />
                                        </Tooltip>
                                    </div>
                                )}
                            </div>

                            {msg.sender === 'user' && (
                                <Avatar size={34} icon={<UserOutlined />} style={{ backgroundColor: '#0075F3', flexShrink: 0 }} />
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="message-item ai">
                            <Avatar size={34} icon={<RobotOutlined />} style={{ backgroundColor: '#FF9C00', flexShrink: 0 }} />
                            <div className="bubble typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* --- Smart Suggestions Bar --- */}
                <SmartSuggestions 
                    lastAiMessage={lastAiMessage} 
                    onSelectSuggestion={(suggestion) => executeSend(suggestion)}
                    disabled={isTyping}
                />

                {/* --- Input Area --- */}
                <div className="input-area">
                    <Button 
                        data-aos="none" 
                        shape="circle"
                        size="large"
                        type={isListening ? "primary" : "default"}
                        danger={isListening}
                        icon={isListening ? <StopOutlined /> : <AudioOutlined />}
                        onClick={handleMicClick}
                        className={`btn-mic ${isListening ? 'listening-pulse' : ''}`}
                        title={isListening ? "Dừng ghi âm & Gửi ngay" : "Nói tiếng Anh (Tự động nhận diện 0ms & Gửi sau 1.2s)"}
                    />

                    <Input 
                        data-aos="none" 
                        size="large" 
                        placeholder={isListening ? "🎙️ Đang lắng nghe bạn nói... (Chữ sẽ xuất hiện tại đây)" : "Nhập tin nhắn tiếng Anh hoặc bấm Mic..."} 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isTyping}
                        allowClear
                    />

                    <Button 
                        data-aos="none" 
                        type="primary" 
                        shape="circle" 
                        icon={isTyping ? <LoadingOutlined /> : <SendOutlined />} 
                        size="large" 
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isTyping}
                        className="btn-send"
                    />
                </div>

            </div>
        </div>
    );
}

export default Chatbox;