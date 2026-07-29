import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Avatar, Tooltip, Spin, message, Alert, Select } from 'antd';
import { SendOutlined, AudioOutlined, RobotOutlined, UserOutlined, ClearOutlined, LoadingOutlined, StopOutlined, SoundOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { chatService } from '../../services/chatService';
import './style.css';

const { Option } = Select;

const WELCOME_MSG = {
    id: 1,
    sender: 'ai',
    text: "Hi there! I'm your English AI Assistant. We can talk about any topic, or I can help you correct your grammar. What's on your mind?"
};

function Chatbox() {
    const { isLogin } = useSelector((state) => state.auth);
    const [messages, setMessages] = useState([WELCOME_MSG]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [selectedVoice, setSelectedVoice] = useState('shimmer');
    const [localTtsUrl, setLocalTtsUrl] = useState('http://localhost:8880/v1/audio/speech');
    
    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioPlayerRef = useRef(null);
    
    // VAD Refs
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const vadIntervalRef = useRef(null);
    const silenceStartRef = useRef(null);
    const isPlayingTTSRef = useRef(false);

    useEffect(() => {
        checkServiceHealth();
        return () => {
            if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
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

    const executeSend = async (userMessage) => {
        if (!userMessage.trim()) return;

        const newUserMsg = {
            id: Date.now(),
            sender: 'user',
            text: userMessage
        };
        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        setIsTyping(true);

        const conversationHistory = messages.slice(-10).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        }));

        const aiMsgId = Date.now() + 1;
        setMessages(prev => [...prev, { id: aiMsgId, sender: 'ai', text: '', isError: false }]);
        
        let currentText = '';
        let sentencesToSpeak = [];
        let fetchedSentenceCount = 0;
        let audioQueue = [];
        let streamFinished = false;
        let isFetchingAudio = false;

        const fetchNextAudios = async () => {
            if (isFetchingAudio) return;
            isFetchingAudio = true;
            
            while (fetchedSentenceCount < sentencesToSpeak.length) {
                const idx = fetchedSentenceCount;
                fetchedSentenceCount++;
                const sentence = sentencesToSpeak[idx];
                
                try {
                    const blob = await chatService.generateTTS(sentence, selectedVoice, localTtsUrl);
                    if (blob) {
                        audioQueue.push({ index: idx, blob: blob });
                        audioQueue.sort((a,b) => a.index - b.index);
                        playNextAudio(); // Kích hoạt phát nếu đang rảnh
                    }
                } catch(e) {
                    console.error("Lỗi TTS ở câu:", sentence, e);
                }
            }
            
            isFetchingAudio = false;
        };

        const playNextAudio = async () => {
            if (isPlayingTTSRef.current) return;
            if (audioQueue.length === 0) {
                if (streamFinished && fetchedSentenceCount >= sentencesToSpeak.length) {
                    setIsTyping(false);
                }
                return;
            }
            
            isPlayingTTSRef.current = true;
            const nextItem = audioQueue.shift();
            
            try {
                if (audioPlayerRef.current) {
                    await new Promise((resolve) => {
                        const url = URL.createObjectURL(nextItem.blob);
                        audioPlayerRef.current.src = url;
                        audioPlayerRef.current.onended = resolve;
                        audioPlayerRef.current.play().catch(e => {
                            console.log("Trình duyệt chặn auto-play");
                            resolve();
                        });
                    });
                }
            } catch(e) {
                console.error("Lỗi phát âm thanh:", e);
            }
            
            isPlayingTTSRef.current = false;
            playNextAudio();
        };

        try {
            await chatService.streamMessage(userMessage, conversationHistory, (chunk) => {
                currentText += chunk;
                
                setMessages(prev => prev.map(msg => 
                    msg.id === aiMsgId ? { ...msg, text: currentText } : msg
                ));

                const sentences = currentText.match(/[^.!?]+[.!?]+/g) || [];
                if (sentences.length > sentencesToSpeak.length) {
                    for (let i = sentencesToSpeak.length; i < sentences.length; i++) {
                        sentencesToSpeak.push(sentences[i].trim());
                    }
                    fetchNextAudios();
                }
            });
            
            streamFinished = true;
            
            const sentences = currentText.match(/[^.!?]+[.!?]+/g) || [];
            const joinedSentences = sentences.join('');
            if (currentText.length > joinedSentences.length) {
                const remainder = currentText.substring(joinedSentences.length).trim();
                if (remainder.length > 0) {
                    sentencesToSpeak.push(remainder);
                    fetchNextAudios();
                }
            }
            
            if (sentencesToSpeak.length === 0 && currentText.trim().length > 0) {
                sentencesToSpeak.push(currentText.trim());
                fetchNextAudios();
            }

            if (fetchedSentenceCount >= sentencesToSpeak.length && audioQueue.length === 0 && !isPlayingTTSRef.current) {
                setIsTyping(false);
            }
            
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => prev.map(msg => 
                msg.id === aiMsgId ? { ...msg, text: generateFallbackResponse(userMessage), isError: true } : msg
            ));
            setIsTyping(false);
            if (!isOnline) {
                message.warning('Không thể kết nối đến AI server. Đang sử dụng chế độ offline.');
            }
        }
    };

    const handleSend = () => {
        executeSend(inputValue);
    };

    const generateFallbackResponse = (userText) => {
        const lowerText = userText.toLowerCase();
        if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('xin chào')) {
            return "Hello! How are you doing today? (Note: AI server is currently offline)";
        }
        if (lowerText.includes('name') || lowerText.includes('tên')) {
            return "I am English AI Tutor, your virtual language assistant. (Note: AI server is currently offline)";
        }
        if (lowerText.includes('thank') || lowerText.includes('cảm ơn')) {
            return "You're welcome! Keep up the good work with your English! (Note: AI server is currently offline)";
        }
        if (lowerText.includes('help') || lowerText.includes('giúp')) {
            return "I can help you practice English conversation, correct grammar, and expand vocabulary. (Note: AI server is currently offline)";
        }
        return "I understand you said: \"" + userText + "\". The AI server is currently unavailable. Please try again later for full AI responses.";
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunksRef.current = [];

            // VAD Setup
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContext();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.minDecibels = -60;
            source.connect(analyserRef.current);
            
            silenceStartRef.current = Date.now();
            
            vadIntervalRef.current = setInterval(() => {
                const bufferLength = analyserRef.current.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyserRef.current.getByteFrequencyData(dataArray);
                
                let sum = 0;
                for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
                const average = sum / bufferLength;
                
                if (average > 10) { 
                    silenceStartRef.current = Date.now();
                } else {
                    if (Date.now() - silenceStartRef.current > 2000) {
                        // 2 seconds of silence -> auto stop
                        stopRecording();
                    }
                }
            }, 100);

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                clearInterval(vadIntervalRef.current);
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                }
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                
                await handleTranscribe(audioBlob);
            };

            mediaRecorderRef.current.start();
            setIsListening(true);
            message.info('Đang nghe... AI sẽ tự động trả lời khi bạn ngừng nói 2 giây.', 3);
        } catch (error) {
            console.error('Recording error:', error);
            message.error('Không thể truy cập microphone. Vui lòng cấp quyền và thử lại.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsListening(false);
        }
    };

    const handleTranscribe = async (audioBlob) => {
        message.loading('Đang xử lý giọng nói...', 0);
        try {
            const result = await chatService.transcribeAudio(audioBlob);
            message.destroy();
            if (result.success && result.transcript) {
                message.success('Đã nhận diện: ' + result.transcript);
                await executeSend(result.transcript); // Tự động gửi
            } else {
                message.warning(result.error || 'Không thể nhận diện giọng nói. Vui lòng thử lại.');
            }
        } catch (error) {
            message.destroy();
            console.error('Transcribe error:', error);
            message.error('Lỗi khi chuyển đổi giọng nói');
        }
    };

    const handleMicClick = () => {
        if (isListening) stopRecording();
        else startRecording();
    };

    const handleClearChat = async () => {
        setMessages([WELCOME_MSG]);
        await chatService.clearConversation();
        message.success('Đã xóa lịch sử chat');
    };

    return (
        <div className="chatbox-page">
            <div className="chatbox-container">
                
                {/* --- Header --- */}
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar style={{ backgroundColor: '#FF9C00' }} icon={<RobotOutlined />} />
                        <div>
                            <h4 style={{ margin: 0 }}>English AI Tutor</h4>
                            <span style={{ fontSize: 12, color: isOnline ? 'green' : 'orange' }}>
                                ● {isOnline ? 'Online' : 'Offline Mode'}
                            </span>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <SoundOutlined style={{ color: '#8c8c8c' }} />
                        <Input 
                            size="small"
                            placeholder="Supertonic URL"
                            value={localTtsUrl}
                            onChange={(e) => setLocalTtsUrl(e.target.value)}
                            style={{ width: 220 }}
                            title="Nhập URL của Supertonic/Kokoro (VD: http://localhost:8880/v1/audio/speech)"
                        />
                        <Select 
                            defaultValue="shimmer" 
                            size="small" 
                            style={{ width: 120 }} 
                            onChange={(val) => setSelectedVoice(val)}
                        >
                            <Option value="shimmer">👩 Nữ (Linda)</Option>
                            <Option value="echo">👨 Nam (James)</Option>
                        </Select>
                        
                        <Button 
                            type="text" 
                            icon={<ClearOutlined />} 
                            onClick={handleClearChat} 
                            title="Xóa lịch sử chat" 
                            style={{ 
                                flexShrink: 0, 
                                width: 32, 
                                height: 32, 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center' 
                            }} 
                        />
                    </div>
                </div>

                {!isLogin && (
                    <Alert
                        message="Đăng nhập để lưu lịch sử chat và sử dụng đầy đủ tính năng"
                        type="info" showIcon closable style={{ margin: '10px 15px' }}
                    />
                )}

                {/* --- Khu vực tin nhắn --- */}
                <div className="messages-area">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message-item ${msg.sender}`}>
                            {msg.sender === 'ai' && (
                                <Avatar size={32} icon={<RobotOutlined />} style={{ backgroundColor: '#FF9C00' }} />
                            )}
                            
                            <div className={`bubble ${msg.isError ? 'error' : ''}`}>
                                {msg.text}
                            </div>

                            {msg.sender === 'user' && (
                                <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: '#0075F3' }} />
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="message-item ai">
                            <Avatar size={32} icon={<RobotOutlined />} style={{ backgroundColor: '#FF9C00' }} />
                            <div className="bubble typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

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
                    />

                    <Input 
                        data-aos="none"
                        size="large" 
                        placeholder="Nhập tin nhắn hoặc bấm mic để nói..." 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isTyping}
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
            
            <audio ref={audioPlayerRef} hidden />
        </div>
    );
}

export default Chatbox;