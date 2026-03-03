import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Avatar, Tooltip, Spin, message, Alert } from 'antd';
import { SendOutlined, AudioOutlined, RobotOutlined, UserOutlined, ClearOutlined, LoadingOutlined, StopOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { chatService } from '../../services/chatService';
import './style.css';

// Tin nhắn chào mừng
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
    
    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Kiểm tra service status khi mount
    useEffect(() => {
        checkServiceHealth();
    }, []);

    // Tự động cuộn xuống tin nhắn mới nhất
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Kiểm tra trạng thái service
    const checkServiceHealth = async () => {
        const result = await chatService.healthCheck();
        setIsOnline(result.success);
    };

    // Gửi tin nhắn
    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage = inputValue.trim();
        
        // 1. Thêm tin nhắn User
        const newUserMsg = {
            id: Date.now(),
            sender: 'user',
            text: userMessage
        };
        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        setIsTyping(true);

        // 2. Chuẩn bị conversation history
        const conversationHistory = messages.slice(-10).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        }));

        try {
            // 3. Gọi API
            const result = await chatService.sendMessage(userMessage, conversationHistory);
            
            if (result.success) {
                const aiResponseText = result.response;
                
                const newAiMsg = {
                    id: Date.now() + 1,
                    sender: 'ai',
                    text: aiResponseText
                };
                
                setMessages(prev => [...prev, newAiMsg]);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Chat error:', error);
            
            // Fallback: Phản hồi local khi API lỗi
            const fallbackResponse = generateFallbackResponse(userMessage);
            const errorMsg = {
                id: Date.now() + 1,
                sender: 'ai',
                text: fallbackResponse,
                isError: true
            };
            setMessages(prev => [...prev, errorMsg]);
            
            if (!isOnline) {
                message.warning('Không thể kết nối đến AI server. Đang sử dụng chế độ offline.');
            }
        } finally {
            setIsTyping(false);
        }
    };

    // Fallback response khi API không khả dụng
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

    // Bắt đầu ghi âm
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await handleTranscribe(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsListening(true);
            message.info('Đang nghe... Bấm lần nữa để dừng.');
        } catch (error) {
            console.error('Recording error:', error);
            message.error('Không thể truy cập microphone. Vui lòng cấp quyền và thử lại.');
        }
    };

    // Dừng ghi âm
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsListening(false);
        }
    };

    // Transcribe audio
    const handleTranscribe = async (audioBlob) => {
        message.loading('Đang chuyển đổi giọng nói...', 0);
        
        try {
            const result = await chatService.transcribeAudio(audioBlob);
            message.destroy();
            
            if (result.success && result.transcript) {
                setInputValue(result.transcript);
                message.success('Đã nhận diện giọng nói!');
            } else {
                message.warning(result.error || 'Không thể nhận diện giọng nói. Vui lòng thử lại.');
            }
        } catch (error) {
            message.destroy();
            console.error('Transcribe error:', error);
            message.error('Lỗi khi chuyển đổi giọng nói');
        }
    };

    // Toggle mic
    const handleMicClick = () => {
        if (isListening) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    // Xóa lịch sử chat
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
                    <Tooltip title="Xóa lịch sử chat">
                        <Button type="text" icon={<ClearOutlined />} onClick={handleClearChat} />
                    </Tooltip>
                </div>

                {/* Login warning */}
                {!isLogin && (
                    <Alert
                        message="Đăng nhập để lưu lịch sử chat và sử dụng đầy đủ tính năng"
                        type="info"
                        showIcon
                        closable
                        style={{ margin: '10px 15px' }}
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

                    {/* Hiệu ứng AI đang gõ */}
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

                {/* --- Khu vực nhập liệu --- */}
                <div className="input-area">
                    <Tooltip title={isListening ? "Đang nghe... Bấm để dừng" : "Bấm để nói"}>
                        <button 
                            className={`btn-mic ${isListening ? 'listening' : ''}`}
                            onClick={handleMicClick}
                        >
                            {isListening ? <StopOutlined /> : <AudioOutlined />}
                        </button>
                    </Tooltip>

                    <Input 
                        size="large" 
                        placeholder="Nhập tin nhắn hoặc bấm mic để nói..." 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        style={{ borderRadius: 20 }}
                        disabled={isTyping}
                    />

                    <Button 
                        type="primary" 
                        shape="circle" 
                        icon={isTyping ? <LoadingOutlined /> : <SendOutlined />} 
                        size="large" 
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isTyping}
                    />
                </div>

            </div>
        </div>
    );
}

export default Chatbox;
