import React, { useState, useEffect, useRef, useMemo } from 'react';
import { chatService } from '../../services/chatService';
import {
    Row, Col, Button, Select, Card, message, Modal, Avatar,
    Spin, Empty, Tag, Input, Space, Typography, Progress,
    Tooltip, Badge
} from 'antd';
import {
    AudioOutlined, RobotOutlined, UserOutlined, ArrowRightOutlined,
    ClockCircleOutlined, PlayCircleOutlined, PauseCircleOutlined,
    SendOutlined, StopOutlined, ReloadOutlined, SoundOutlined,
    DownloadOutlined, CustomerServiceOutlined, BookOutlined, FireOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useConversation } from '../../hooks/useConversation';
import { conversationService } from '../../services/conversationService';
import WordLookupPopover from '../../components/WordLookupPopover';
import './style.css';
import levenshtein from 'fast-levenshtein';

const { Text, Title } = Typography;
const { TextArea } = Input;

/**
 * UI Configuration cho topics - Icon và màu sắc hiển thị
 * Backend lưu topic dạng string tự do, UI config giúp hiển thị đẹp hơn
 * Nếu topic không có trong config, sẽ dùng default
 */
const TOPIC_UI_CONFIG = {
    // Các topic phổ biến với icon và màu
    'restaurant': { icon: '🍽️', color: '#FF6B6B' },
    'shopping': { icon: '🛍️', color: '#4ECDC4' },
    'job_interview': { icon: '💼', color: '#45B7D1' },
    'travel': { icon: '✈️', color: '#FFA07A' },
    'business_meeting': { icon: '🏢', color: '#98D8C8' },
    'medical_appointment': { icon: '🏥', color: '#F7DC6F' },
    'education': { icon: '🎓', color: '#BB8FCE' },
    'friendship': { icon: '👥', color: '#85C1E2' },
    'family': { icon: '👨‍👩‍👧‍👦', color: '#F8B739' },
    'hobbies': { icon: '🎨', color: '#E74C3C' },
    'sports': { icon: '⚽', color: '#27AE60' },
    'technology': { icon: '💻', color: '#3498DB' },
    'food': { icon: '🍔', color: '#E67E22' },
    'weather': { icon: '🌤️', color: '#1ABC9C' },
    'health': { icon: '💪', color: '#9B59B6' },
    'movies': { icon: '🎬', color: '#E91E63' },
    'music': { icon: '🎵', color: '#673AB7' },
    'work': { icon: '💼', color: '#607D8B' },
    'daily_life': { icon: '🏠', color: '#795548' },
    'school': { icon: '📚', color: '#FF9800' },
    'airport': { icon: '🛫', color: '#3498DB' },
    'hotel': { icon: '🏨', color: '#E67E22' },
    'coffee_shop': { icon: '☕', color: '#8D6E63' },
    'workplace': { icon: '💼', color: '#455A64' },
    'banking': { icon: '🏦', color: '#00897B' },
};

// Default config cho topic không có trong UI config
const DEFAULT_TOPIC_UI = { icon: '💬', color: '#1890FF' };

/**
 * UI Configuration cho levels - Màu sắc theo độ khó
 * Backend trả về { value, label } - ta chỉ cần map màu
 */
const LEVEL_UI_CONFIG = {
    'beginner': { color: '#52C41A', icon: '🌱' },
    'intermediate': { color: '#FAAD14', icon: '🌿' },
    'advanced': { color: '#FF4D4F', icon: '🌳' },
};

const DEFAULT_LEVEL_UI = { color: '#1890FF', icon: '📖' };

/**
 * Capitalize chuẩn: viết hoa chữ cái đầu mỗi từ, giữ nguyên dấu tiếng Việt
 * "daily_life" -> "Daily Life", "đời sống hàng ngày" -> "Đời Sống Hàng Ngày"
 */
const capitalizeWords = (str) => {
    if (!str) return '';
    return str
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Helper function để lấy UI config cho topic
 */
const getTopicUI = (topic) => {
    if (!topic) return DEFAULT_TOPIC_UI;
    const key = topic.toLowerCase().replace(/\s+/g, '_');
    return TOPIC_UI_CONFIG[key] || DEFAULT_TOPIC_UI;
};

/**
 * Helper function để lấy UI config cho level
 */
const getLevelUI = (level) => {
    if (!level) return DEFAULT_LEVEL_UI;
    return LEVEL_UI_CONFIG[level.toLowerCase()] || DEFAULT_LEVEL_UI;
};

function Conversation() {
    const { user } = useSelector((state) => state.auth);
    const [step, setStep] = useState('setup');
    const [selectedLevel, setSelectedLevel] = useState('beginner');
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [textInput, setTextInput] = useState('');
    const [playingAudioIndex, setPlayingAudioIndex] = useState(null);
    const [currentAudioProgress, setCurrentAudioProgress] = useState(0);
    const [isPlayingAll, setIsPlayingAll] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    // --- CHẾ ĐỘ SHADOWING (DỌN DẸP SẠCH SẼ) ---
    const [isShadowingMode, setIsShadowingMode] = useState(false);
    const [shadowingIndex, setShadowingIndex] = useState(-1);
    const [shadowingMicActive, setShadowingMicActive] = useState(false);
    const shadowingRecorderRef = useRef(null);
    const shadowingChunksRef = useRef([]);
    const [shadowingAttempts, setShadowingAttempts] = useState({}); // Lưu số lần đọc: { 0: 1, 1: 2... }

    const {
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
        loadMetadata,
    } = useConversation();

    const chatEndRef = useRef(null);
    const audioRef = useRef(null);
    const playAllQueueRef = useRef([]);
    const isPlayingAllRef = useRef(false);

    // Build topics list với UI config - kết hợp data từ backend và UI config
    const topicsWithUI = useMemo(() => {
        if (!topics || topics.length === 0) return [];
        return topics.map(topic => {
            const ui = getTopicUI(topic.name);
            return {
                key: topic.name,
                name: topic.name,
                displayName: capitalizeWords(topic.name),
                count: topic.count || 0,
                ...ui
            };
        });
    }, [topics]);

    // Build levels list với UI config
    const levelsWithUI = useMemo(() => {
        if (!levels || levels.length === 0) {
            // Fallback nếu chưa load được từ backend
            return [
                { value: 'beginner', label: 'Cơ bản', ...getLevelUI('beginner') },
                { value: 'intermediate', label: 'Trung cấp', ...getLevelUI('intermediate') },
                { value: 'advanced', label: 'Nâng cao', ...getLevelUI('advanced') },
            ];
        }
        return levels.map(level => ({
            ...level,
            ...getLevelUI(level.value)
        }));
    }, [levels]);

    // Load metadata khi component mount
    useEffect(() => {
        if (user?.id) {
            loadMetadata();
        }
    }, [user?.id, loadMetadata]);

    // Load scenarios khi component mount hoặc khi filter thay đổi
    useEffect(() => {
        if (user?.id) {
            const filters = { level: selectedLevel };
            if (selectedTopic) {
                filters.topic = selectedTopic;
            }
            loadScenarios(filters);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLevel, selectedTopic, user?.id]);

    // Connect WebSocket khi user đăng nhập
    useEffect(() => {
        if (user?.id && !isConnected) {
            connectWebSocket();
        }
    }, [user, isConnected, connectWebSocket]);

    // Auto scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversationMessages]);

    // Scenarios đã được filter bởi API (server-side), không cần filter lại ở client
    // Chỉ lọc thêm is_active để phòng trường hợp API trả về cả inactive
    const filteredScenarios = useMemo(() => {
        return scenarios.filter(s => s.is_active !== false);
    }, [scenarios]);

    // Lấy level UI info cho selected level
    const getSelectedLevelUI = () => {
        const level = levelsWithUI.find(l => l.value === selectedLevel);
        return level || { label: selectedLevel, ...DEFAULT_LEVEL_UI };
    };

    // Lấy topic UI info cho selected topic  
    const getSelectedTopicUI = () => {
        if (!selectedTopic) return null;
        const topic = topicsWithUI.find(t => t.key === selectedTopic);
        return topic || { displayName: selectedTopic, ...DEFAULT_TOPIC_UI };
    };

    // Handle chọn conversation để học
    const handleSelectConversation = async (scenario) => {
        try {
            // Lưu conversation đã chọn
            setSelectedConversation(scenario);

            // Tăng usage count
            if (scenario.id) {
                await conversationService.incrementUsage(scenario.id);
            }

            // Chuyển sang listen mode
            setStep('listen');
        } catch (error) {
            console.error('Error selecting conversation:', error);
            // Vẫn cho phép xem conversation dù có lỗi
            setSelectedConversation(scenario);
            setStep('listen');
        }
    };

    // Handle start real-time conversation (WebSocket mode)
    const handleStartRealtimeConversation = async (scenarioId) => {
        if (!isConnected) {
            connectWebSocket();
            message.info('Đang kết nối với AI Server, vui lòng bấm lại sau 1 giây...');
            return;
        }

        try {
            await startConversation(scenarioId);
            setStep('practice');
        } catch (error) {
            message.error('Không thể bắt đầu hội thoại');
        }
    };

    // Handle send text message
    const handleSendText = () => {
        if (!textInput.trim()) return;

        sendTextMessage(textInput);
        setTextInput('');
    };

    // Handle mic click
    const handleMicClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };
    // --- HÀM XỬ LÝ MIC CHO CHẾ ĐỘ LUYỆN TẬP (SHADOWING) ---
    const handleShadowingMic = async () => {
        if (shadowingMicActive) {
            // Tắt mic và gửi lấy transcript
            shadowingRecorderRef.current.stop();
            setShadowingMicActive(false);
        } else {
            // Bật mic
            try {
                // Tăng số lần đọc
                setShadowingAttempts(prev => ({
                    ...prev,
                    [shadowingIndex]: (prev[shadowingIndex] || 0) + 1
                }));

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                shadowingRecorderRef.current = new MediaRecorder(stream);
                shadowingChunksRef.current = [];

                shadowingRecorderRef.current.ondataavailable = (e) => shadowingChunksRef.current.push(e.data);

                shadowingRecorderRef.current.onstop = async () => {
                    const blob = new Blob(shadowingChunksRef.current, { type: 'audio/webm' });
                    stream.getTracks().forEach(t => t.stop());

                    const lines = selectedConversation.sample_conversation || selectedConversation.lines || [];
                    const currentLine = lines[shadowingIndex];
                    const expectedText = currentLine.content || currentLine.message || currentLine.text;

                    message.loading({ content: 'AI đang chấm điểm...', key: 'eval', duration: 0 });

                    try {
                        const formData = new FormData();
                        formData.append('audio', blob);
                        formData.append('text', expectedText);

                        // Gọi API để lấy transcript (Vẫn dùng API cũ, nhưng ta tự chấm điểm ở Frontend)
                        const res = await conversationService.evaluatePronunciation(formData);
                        message.destroy('eval');

                        const transcript = res?.transcript || "No transcript detected";
                        
                        // ==========================================
                        // LOGIC CHẤM ĐIỂM VÀ BÔI MÀU (THỰC THI TẠI REACT)
                        // ==========================================
                        const cleanStr = (s) => s.toLowerCase().replace(/[^\w\s]/gi, '');
                        const expWords = cleanStr(expectedText).split(' ');
                        const actWords = cleanStr(transcript).split(' ');
                        const origWords = expectedText.split(' '); // Giữ nguyên chữ gốc có viết hoa, dấu phẩy

                        // Tính khoảng cách Levenshtein (Số bước sửa để giống nhau)
                        const distance = levenshtein.get(expWords.join(' '), actWords.join(' '));
                        const maxLength = Math.max(expWords.join(' ').length, actWords.join(' ').length);
                        
                        // Tính điểm % (0 - 100)
                        let calculatedScore = Math.max(0, 100 - (distance / maxLength * 100));
                        calculatedScore = Math.round(calculatedScore);

                        // LUẬT 1: Sai hoàn toàn (< 20%) -> 0 điểm
                        if (calculatedScore < 20) {
                            calculatedScore = 0;
                        }

                        // LUẬT 2: Phân tích từng chữ Xanh/Đỏ
                        const wordsResult = origWords.map((word, i) => {
                            const cleanWord = cleanStr(word);
                            // Tìm xem chữ này có xuất hiện trong câu đọc của SV không
                            const isCorrect = actWords.includes(cleanWord);
                            return { word, status: isCorrect ? 'correct' : 'incorrect' };
                        });

                        // Sinh Feedback động
                        let feedback = "AI không đưa ra nhận xét.";
                        if (calculatedScore === 0) {
                            feedback = "Bạn đọc sai hoàn toàn so với câu gốc rồi, vui lòng tập trung nghe lại nhé!";
                        } else if (calculatedScore >= 80) {
                            feedback = "Phát âm rất tốt! Bạn đã nắm bắt được âm điệu.";
                        } else if (calculatedScore >= 50) {
                            feedback = "Khá tốt, nhưng chú ý các từ màu đỏ nhé.";
                        } else {
                            feedback = "Cần cố gắng hơn. Chú ý các từ bị bôi đỏ.";
                        }
                        // ==========================================

                        // Hiển thị Bảng kết quả (Modal)
                        Modal.info({
                            title: `Kết quả: ${calculatedScore}/100 Điểm`,
                            width: 600,
                            content: (
                                <div style={{ marginTop: 15 }}>
                                    <p><strong>Bạn đã nói:</strong> <span style={{ color: '#888', fontStyle: 'italic' }}>"{transcript}"</span></p>
                                    
                                    <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '8px', marginBottom: '15px' }}>
                                        <p style={{ margin: '0 0 10px 0' }}><strong>Đánh giá chi tiết:</strong></p>
                                        <p style={{ fontSize: '18px', margin: 0, lineHeight: '1.6' }}>
                                            {calculatedScore === 0 ? (
                                                <span style={{ color: '#f5222d', fontWeight: 'bold' }}>Sai hoàn toàn! Vui lòng nghe lại mẫu.</span>
                                            ) : (
                                                wordsResult.map((w, i) => (
                                                    <span 
                                                        key={i} 
                                                        style={{ 
                                                            color: w.status === 'correct' ? '#52c41a' : '#f5222d', 
                                                            textDecoration: w.status === 'incorrect' ? 'underline' : 'none',
                                                            marginRight: '6px',
                                                            fontWeight: w.status === 'incorrect' ? 'bold' : 'normal'
                                                        }}
                                                    >
                                                        {w.word}
                                                    </span>
                                                ))
                                            )}
                                        </p>
                                    </div>

                                    <p><strong>AI Nhận xét:</strong> {feedback}</p>
                                </div>
                            ),
                            okText: calculatedScore >= 80 ? 'Câu tiếp theo' : 'Thử lại',
                            onOk: () => {
                                if (calculatedScore >= 80) {
                                    const nextIndex = shadowingIndex + 1;
                                    if (nextIndex < lines.length) {
                                        setShadowingIndex(nextIndex);
                                        setTimeout(() => handlePlayLineAudio(lines[nextIndex], nextIndex), 500);
                                    } else {
                                        setIsShadowingMode(false);
                                        message.success('Hoàn thành bài tập!');
                                    }
                                } else {
                                    // LUẬT 3: Đọc sai bắt đọc lại (Bật lại audio câu mẫu)
                                    setTimeout(() => handlePlayLineAudio(currentLine, shadowingIndex), 500);
                                }
                            }
                        });
                    } catch (e) {
                        message.destroy('eval');
                        console.error("Lỗi API:", e);
                        message.error('Máy chủ AI bận, vui lòng thử lại sau.');
                    }
                };

                shadowingRecorderRef.current.start();
                setShadowingMicActive(true);
            } catch (err) {
                message.error('Vui lòng cấp quyền Microphone!');
            }
        }
    };

    const handlePlayLineAudio = async (line, index) => {
        if (playingAudioIndex === index) {
            if (audioRef.current) audioRef.current.pause();
            setPlayingAudioIndex(null);
            return;
        }
        if (audioRef.current) audioRef.current.pause();

        const playWithTTS = () => {
            const textToRead = line.content || line.message || line.text;
            if (!textToRead) return;

            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(textToRead);
                utterance.lang = 'en-US';
                utterance.rate = playbackSpeed;
                utterance.pitch = index % 2 === 0 ? 1.05 : 0.95;

                // Select high quality voice if available
                const voices = window.speechSynthesis.getVoices();
                const enVoices = voices.filter(v => v.lang.startsWith('en'));
                if (enVoices.length > 0) {
                    if (index % 2 === 0) {
                        const femaleVoice = enVoices.find(v => /female|zira|samantha|victoria|karen|susan|google us english/i.test(v.name));
                        if (femaleVoice) utterance.voice = femaleVoice;
                    } else {
                        const maleVoice = enVoices.find(v => /male|david|daniel|george|alex/i.test(v.name));
                        if (maleVoice) utterance.voice = maleVoice;
                    }
                }

                utterance.onend = () => {
                    setPlayingAudioIndex(null);
                    setCurrentAudioProgress(0);
                    if (isPlayingAllRef.current && playAllQueueRef.current.length > 0) {
                        const nextIndex = playAllQueueRef.current.shift();
                        const allLines = selectedConversation.sample_conversation || selectedConversation.lines || [];
                        handlePlayLineAudio(allLines[nextIndex], nextIndex);
                    } else if (isPlayingAllRef.current) {
                        setIsPlayingAll(false);
                        isPlayingAllRef.current = false;
                    }
                };
                utterance.onerror = () => {
                    setPlayingAudioIndex(null);
                    setCurrentAudioProgress(0);
                };
                setPlayingAudioIndex(index);
                window.speechSynthesis.speak(utterance);
            } else {
                message.error('Trình duyệt không hỗ trợ phát âm thanh!');
            }
        };

        const setupAudioEvents = (audio, idx) => {
            audio.playbackRate = playbackSpeed;
            audioRef.current = audio;
            audio.ontimeupdate = () => setCurrentAudioProgress((audio.currentTime / audio.duration) * 100);
            audio.onended = () => {
                setPlayingAudioIndex(null);
                setCurrentAudioProgress(0);
                if (isPlayingAllRef.current && playAllQueueRef.current.length > 0) {
                    const nextIndex = playAllQueueRef.current.shift();
                    const allLines = selectedConversation.sample_conversation || selectedConversation.lines || [];
                    handlePlayLineAudio(allLines[nextIndex], nextIndex);
                } else if (isPlayingAllRef.current) {
                    setIsPlayingAll(false);
                    isPlayingAllRef.current = false;
                }
            };
        };

        try {
            const filename = line.audioUrl || line.audio_url;
            const convId = selectedConversation?.id || selectedConversation?._id;
            const fullUrl = conversationService.getAudioUrl(convId, filename);

            if (!fullUrl || fullUrl.includes('undefined')) {
                return await playWithTTS();
            }

            const audio = new Audio(fullUrl);
            setupAudioEvents(audio, index);

            // THỬ PHÁT FILE TỪ SERVER
            try {
                await audio.play();
                setPlayingAudioIndex(index);
            } catch (playError) {
                console.warn("File server lỗi (404), đang chuyển sang AI Fallback...");
                await playWithTTS(); // TỰ ĐỘNG CỨU KHI 404
            }
        } catch (err) {
            console.error('Lỗi tổng quát:', err);
            await playWithTTS();
        }
    };

    // Play all - phát tất cả các câu liên tục
    const handlePlayAll = () => {
        if (!selectedConversation) return;

        const lines = selectedConversation.sample_conversation || selectedConversation.lines || [];
        if (lines.length === 0) {
            message.warning('Hội thoại này chưa có nội dung');
            return;
        }

        // Stop current playback
        if (audioRef.current) {
            audioRef.current.pause();
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        // Build queue of all indices
        playAllQueueRef.current = lines.map((_, idx) => idx);

        isPlayingAllRef.current = true;
        setIsPlayingAll(true);

        // Start playing from first
        if (playAllQueueRef.current.length > 0) {
            const firstIndex = playAllQueueRef.current.shift();
            handlePlayLineAudio(lines[firstIndex], firstIndex);
        }
    };

    // Stop all playback
    const handleStopAll = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        playAllQueueRef.current = [];
        isPlayingAllRef.current = false;
        setIsPlayingAll(false);
        setPlayingAudioIndex(null);
        setCurrentAudioProgress(0);
    };

    // Download audio
    const handleDownloadAudio = async (line, index) => {
        const fullUrl = conversationService.getFullAudioUrl(line.audioUrl || line.audio_url);
        if (!fullUrl) {
            message.warning('Không có audio để tải');
            return;
        }

        try {
            const response = await fetch(fullUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `line_${index + 1}.mp3`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            message.success('Đã tải audio');
        } catch (error) {
            message.error('Không thể tải audio');
        }
    };

    // Cập nhật playback speed
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackSpeed;
        }
    }, [playbackSpeed]);

    // Handle end conversation
    const handleEndConversation = () => {
        Modal.confirm({
            title: 'Kết thúc hội thoại?',
            content: 'Bạn có chắc muốn kết thúc hội thoại này?',
            onOk: () => {
                endConversation();
                setStep('setup');
                setTextInput('');
            }
        });
    };

    // Handle back to setup
    const handleBackToSetup = () => {
        handleStopAll();
        setSelectedConversation(null);
        setStep('setup');
    };

    // Render Listen Screen - User nghe và học hội thoại
    if (step === 'listen' && selectedConversation) {
        const lines = selectedConversation.sample_conversation || selectedConversation.lines || [];
        const hasAnyAudio = lines.some(line => line.audioUrl || line.audio_url);

        return (
            <div className="conversation-page">
                <div className="listen-container">
                    {/* Header */}
                    <div className="listen-header">
                        <Button type="text" icon={<ArrowRightOutlined style={{ transform: 'rotate(180deg)' }} />} onClick={handleBackToSetup}>
                            Quay lại
                        </Button>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <Title level={3} style={{ margin: 0 }}>{selectedConversation.title}</Title>
                            <Space style={{ marginTop: 8 }}>
                                {(() => {
                                    const levelUI = getLevelUI(selectedConversation.level);
                                    const levelInfo = levelsWithUI.find(l => l.value === selectedConversation.level);
                                    return (
                                        <Tag color={levelUI.color}>
                                            {levelUI.icon} {levelInfo?.label || selectedConversation.level}
                                        </Tag>
                                    );
                                })()}
                                {selectedConversation.topic && (
                                    (() => {
                                        const topicUI = getTopicUI(selectedConversation.topic);
                                        return (
                                            <Tag color={topicUI.color}>
                                                {topicUI.icon} {selectedConversation.topic.replace(/_/g, ' ')}
                                            </Tag>
                                        );
                                    })()
                                )}
                                {selectedConversation.difficulty && (
                                    <Tooltip title={`Độ khó: ${selectedConversation.difficulty}/5`}>
                                        <Tag color="purple">
                                            <FireOutlined /> {selectedConversation.difficulty}/5
                                        </Tag>
                                    </Tooltip>
                                )}
                            </Space>
                        </div>
                        <div style={{ width: 100 }} />
                    </div>

                    {/* Description */}
                    {selectedConversation.description && (
                        <div style={{ padding: '0 20px', marginBottom: 20 }}>
                            <Text type="secondary">{selectedConversation.description}</Text>
                        </div>
                    )}

                    {/* Audio Controls */}
                    <div className="audio-controls">
                            <Space size="middle">

                                <Button
                                    type="primary"
                                    shape="round"
                                    size="large"
                                    icon={<FireOutlined />}
                                    onClick={() => {
                                        setIsShadowingMode(true);
                                        setShadowingIndex(0);
                                        // Phát câu đầu tiên
                                        handlePlayLineAudio(lines[0], 0);
                                    }}
                                    style={{ backgroundColor: '#52C41A', borderColor: '#52C41A' }}
                                >
                                    Bắt đầu Shadowing
                                </Button>
                                <Tooltip title={isPlayingAll ? "Dừng phát" : "Phát tất cả"}>
                                    <Button
                                        type="primary"
                                        shape="round"
                                        size="large"
                                        icon={isPlayingAll ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                                        onClick={isPlayingAll ? handleStopAll : handlePlayAll}
                                    >
                                        {isPlayingAll ? 'Dừng phát' : 'Phát tất cả'}
                                    </Button>
                                </Tooltip>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Text>Tốc độ:</Text>
                                    <Select
                                        value={playbackSpeed}
                                        onChange={setPlaybackSpeed}
                                        style={{ width: 90 }}
                                        getPopupContainer={triggerNode => triggerNode.parentElement}
                                        options={[
                                            { value: 0.5, label: '0.5x' },
                                            { value: 0.75, label: '0.75x' },
                                            { value: 1, label: '1x' },
                                            { value: 1.25, label: '1.25x' },
                                            { value: 1.5, label: '1.5x' },
                                        ]}
                                    />
                                </div>
                            </Space>
                        </div>

                    {/* Participants */}
                    {selectedConversation.participants && selectedConversation.participants.length > 0 && (
                        <div style={{ padding: '0 20px', marginBottom: 16 }}>
                            <Text strong>Nhân vật: </Text>
                            {selectedConversation.participants.map((p, idx) => (
                                <Tag key={idx} color="blue">{p.name}</Tag>
                            ))}
                        </div>
                    )}

                    {/* Conversation Lines */}
                    <div className="conversation-lines">
                        {lines.length === 0 ? (
                            <Empty description="Hội thoại này chưa có nội dung" />
                        ) : (
                            lines.map((line, index) => {
                                const hasAudio = line.audioUrl || line.audio_url;
                                const isPlaying = playingAudioIndex === index;
                                const speaker = line.speaker || `Người ${index % 2 === 0 ? 'A' : 'B'}`;
                                const content = line.content || line.message || line.text;
                                const isFirstSpeaker = index === 0 || line.speaker === lines[0].speaker;

                                return (
                                    <div
                                        key={line._id || line.id || index}
                                        className={`conversation-line ${isFirstSpeaker ? 'speaker-a' : 'speaker-b'} ${isPlaying ? 'playing' : ''}`}
                                    >
                                        <div className="line-avatar">
                                            <Avatar
                                                size={40}
                                                style={{
                                                    backgroundColor: isFirstSpeaker ? '#FF9C00' : '#0075F3'
                                                }}
                                            >
                                                {speaker.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </div>

                                        <div className="line-content">
                                            <div className="line-header">
                                                <Text strong style={{ color: isFirstSpeaker ? '#FF9C00' : '#0075F3' }}>
                                                    {speaker}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    #{index + 1}
                                                </Text>
                                            </div>

                                            <div className="line-text" style={{ 
    // Logic: Nếu đang ở câu hiện tại + Đang thu âm + Số lần đọc >= 2 -> Làm mờ chữ (Giấu)
    filter: (isShadowingMode && shadowingIndex === index && shadowingMicActive && shadowingAttempts[index] > 1) 
        ? 'blur(5px)' 
        : 'none',
    transition: 'filter 0.3s ease',
    userSelect: (isShadowingMode && shadowingIndex === index && shadowingMicActive && shadowingAttempts[index] > 1) 
        ? 'none' 
        : 'auto' // Chống bôi đen copy
}}>
    <WordLookupPopover text={content} />
</div>

                                            {/* Audio controls for this line */}
                                            <div className="line-audio-controls">
                                                <Space>
                                                    <Tooltip title={isPlaying ? "Tạm dừng" : "Nghe câu này"}>
                                                        <Button
                                                            type={isPlaying ? "primary" : "default"}
                                                            shape="circle"
                                                            size="small"
                                                            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                                                            onClick={() => handlePlayLineAudio(line, index)}
                                                        />
                                                    </Tooltip>

                                                    {isPlaying && (
                                                        <Progress
                                                            percent={currentAudioProgress || 50}
                                                            size="small"
                                                            showInfo={false}
                                                            style={{ width: 100 }}
                                                        />
                                                    )}

                                                    {hasAudio && (
                                                        <Tooltip title="Tải xuống">
                                                            <Button
                                                                type="text"
                                                                size="small"
                                                                icon={<DownloadOutlined />}
                                                                onClick={() => handleDownloadAudio(line, index)}
                                                            />
                                                        </Tooltip>
                                                    )}

                                                    {isShadowingMode && shadowingIndex === index && (
                                                        <Button
                                                            type={shadowingMicActive ? "primary" : "default"}
                                                            danger={shadowingMicActive}
                                                            shape="round"
                                                            size="small"
                                                            icon={shadowingMicActive ? <StopOutlined /> : <AudioOutlined />}
                                                            onClick={handleShadowingMic}
                                                        >
                                                            {shadowingMicActive ? "Dừng ghi âm" : "Bấm để đọc"}
                                                        </Button>
                                                    )}
                                                </Space>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Key Vocabulary */}
                    {selectedConversation.tags && selectedConversation.tags.length > 0 && (
                        <div style={{ padding: 20, borderTop: '1px solid #f0f0f0' }}>
                            <Title level={5}>Từ vựng liên quan</Title>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {selectedConversation.tags.map((tag, idx) => (
                                    <Tag key={idx} color="cyan">{tag}</Tag>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Render Setup Screen
    if (step === 'setup') {
        const selectedTopicUI = getSelectedTopicUI();

        return (
            <div className="conversation-page">
                <div className="setup-container">
                    <Title level={2} style={{ color: '#0075F3', marginBottom: 10 }}>
                        Luyện hội thoại tiếng Anh
                    </Title>
                    <Text type="secondary">
                        Chọn chủ đề và trình độ phù hợp với bạn
                    </Text>

                    {/* Chọn Level */}
                    <div style={{ textAlign: 'left', marginTop: 30 }}>
                        <Title level={4}>1. Chọn trình độ</Title>
                        <Select
                            value={selectedLevel}
                            style={{ width: '100%' }}
                            loading={loadingMeta}
                            onChange={(val) => {
                                setSelectedLevel(val);
                                setSelectedTopic(null);
                            }}
                            options={levelsWithUI.map(level => ({
                                value: level.value,
                                label: (
                                    <Space>
                                        <span>{level.icon}</span>
                                        <span>{level.label}</span>
                                        <Tag color={level.color} style={{ marginLeft: 8 }}>{level.value}</Tag>
                                    </Space>
                                )
                            }))}
                        />
                    </div>

                    {/* Chọn Topic */}
                    <div style={{ textAlign: 'left', marginTop: 20 }}>
                        <Title level={4}>
                            2. Chọn chủ đề
                            {selectedTopicUI && (
                                <Tag color={selectedTopicUI.color} style={{ marginLeft: 8 }}>
                                    {selectedTopicUI.icon} {selectedTopicUI.displayName}
                                </Tag>
                            )}
                        </Title>

                        {loadingMeta ? (
                            <div style={{ textAlign: 'center', padding: 20 }}>
                                <Spin tip="Đang tải danh sách chủ đề..." />
                            </div>
                        ) : topicsWithUI.length === 0 ? (
                            <Empty
                                description="Chưa có chủ đề nào. Vui lòng tạo hội thoại trước."
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        ) : (
                            <div className="topic-grid">
                                {topicsWithUI.map((topic) => (
                                    <div
                                        key={topic.key}
                                        className={`topic-item ${selectedTopic === topic.key ? 'active' : ''}`}
                                        onClick={() => setSelectedTopic(selectedTopic === topic.key ? null : topic.key)}
                                        style={{
                                            borderColor: selectedTopic === topic.key ? topic.color : '#eee',
                                            backgroundColor: selectedTopic === topic.key ? `${topic.color}15` : '#fff'
                                        }}
                                    >
                                        <span style={{ fontSize: 24, marginRight: 8 }}>{topic.icon}</span>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <span>{topic.displayName}</span>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {topic.count} hội thoại
                                            </Text>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Danh sách Conversations */}
                    <div style={{ textAlign: 'left', marginTop: 30 }}>
                        <Title level={4}>
                            3. Chọn hội thoại để học
                            {filteredScenarios.length > 0 && (
                                <Text type="secondary" style={{ fontSize: 14, marginLeft: 8 }}>
                                    ({filteredScenarios.length} kết quả)
                                </Text>
                            )}
                        </Title>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: 40 }}>
                                <Spin size="large" tip="Đang tải danh sách hội thoại..." />
                            </div>
                        ) : filteredScenarios.length === 0 ? (
                            <Empty
                                description={
                                    <span>
                                        Không có hội thoại nào phù hợp với
                                        <Tag color={getSelectedLevelUI().color} style={{ margin: '0 4px' }}>
                                            {getSelectedLevelUI().label}
                                        </Tag>
                                        {selectedTopicUI && (
                                            <>
                                                và chủ đề
                                                <Tag color={selectedTopicUI.color} style={{ margin: '0 4px' }}>
                                                    {selectedTopicUI.displayName}
                                                </Tag>
                                            </>
                                        )}
                                    </span>
                                }
                            />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 15 }}>
                                {filteredScenarios.map((scenario) => {
                                    const hasAudio = scenario.hasAudio || scenario.audioGenerationStatus === 'completed';
                                    const audioProgress = scenario.audioGenerationProgress || 0;
                                    const totalLines = scenario.totalLines || (scenario.lines?.length) || 0;
                                    const levelUI = getLevelUI(scenario.level);
                                    const topicUI = getTopicUI(scenario.topic);
                                    const levelInfo = levelsWithUI.find(l => l.value === scenario.level);

                                    return (
                                        <Badge.Ribbon
                                            key={scenario.id}
                                            text={hasAudio ? "Có Audio" : audioProgress > 0 ? `${audioProgress}%` : ""}
                                            color={hasAudio ? "green" : audioProgress > 0 ? "orange" : "transparent"}
                                        >
                                            <Card
                                                hoverable
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleSelectConversation(scenario)}
                                            >
                                                <Space direction="vertical" style={{ width: '100%' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                                        <Space>
                                                            <Title level={5} style={{ margin: 0 }}>{scenario.title}</Title>
                                                            {hasAudio && (
                                                                <Tooltip title="Hội thoại có âm thanh">
                                                                    <SoundOutlined style={{ color: '#52C41A', fontSize: 18 }} />
                                                                </Tooltip>
                                                            )}
                                                            {scenario.difficulty && (
                                                                <Tooltip title={`Độ khó: ${scenario.difficulty}/5`}>
                                                                    <Tag color="purple" style={{ margin: 0 }}>
                                                                        <FireOutlined /> {scenario.difficulty}
                                                                    </Tag>
                                                                </Tooltip>
                                                            )}
                                                        </Space>
                                                        <Space wrap>
                                                            <Tag color={levelUI.color}>
                                                                {levelUI.icon} {levelInfo?.label || scenario.level}
                                                            </Tag>
                                                            {scenario.topic && (
                                                                <Tag color={topicUI.color}>
                                                                    {topicUI.icon} {scenario.topic.replace(/_/g, ' ')}
                                                                </Tag>
                                                            )}
                                                        </Space>
                                                    </div>
                                                    <Text type="secondary">{scenario.description}</Text>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                                        <Space wrap>
                                                            {scenario.participants && scenario.participants.length > 0 && (
                                                                <Text>
                                                                    <UserOutlined /> {scenario.participants.map(p => p.name).join(', ')}
                                                                </Text>
                                                            )}
                                                            {scenario.duration && (
                                                                <Text type="secondary">
                                                                    <ClockCircleOutlined /> ~{scenario.duration} phút
                                                                </Text>
                                                            )}
                                                        </Space>
                                                        <Space>
                                                            <Text type="secondary">
                                                                <CustomerServiceOutlined /> {totalLines} câu
                                                            </Text>
                                                            {scenario.usageCount > 0 && (
                                                                <Tooltip title="Số lần được học">
                                                                    <Text type="secondary">
                                                                        <BookOutlined /> {scenario.usageCount}
                                                                    </Text>
                                                                </Tooltip>
                                                            )}
                                                        </Space>
                                                    </div>
                                                    {scenario.tags && scenario.tags.length > 0 && (
                                                        <div>
                                                            {scenario.tags.slice(0, 5).map((tag, idx) => (
                                                                <Tag key={idx} style={{ marginTop: 4 }}>{tag}</Tag>
                                                            ))}
                                                            {scenario.tags.length > 5 && (
                                                                <Text type="secondary" style={{ marginLeft: 4 }}>
                                                                    +{scenario.tags.length - 5} tags
                                                                </Text>
                                                            )}
                                                        </div>
                                                    )}
                                                </Space>
                                            </Card>
                                        </Badge.Ribbon>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {!isConnected && (
                        <div style={{ marginTop: 20, textAlign: 'center' }}>
                            <Text type="warning">Đang kết nối với server...</Text>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Render Practice Screen
    return (
        <div className="conversation-page">
            <div className="conversation-container">
                <Row gutter={[24, 24]} style={{ height: '100%' }}>
                    {/* CỘT TRÁI: CHAT WINDOW */}
                    <Col xs={24} md={16} style={{ height: '100%' }}>
                        <div className="chat-window">
                            {/* Header */}
                            <div className="chat-header">
                                <div>
                                    <Title level={5} style={{ margin: 0 }}>
                                        {currentScenario?.title || 'Hội thoại'}
                                    </Title>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {currentScenario?.ai_character_name && (
                                            <>Nhân vật: {currentScenario.ai_character_name} • </>
                                        )}
                                        {isConnected ? 'Đã kết nối' : 'Đang kết nối...'}
                                    </Text>
                                </div>
                                <Button
                                    icon={<StopOutlined />}
                                    danger
                                    size="small"
                                    onClick={handleEndConversation}
                                >
                                    Kết thúc
                                </Button>
                            </div>

                            {/* Chat Body */}
                            <div className="chat-body">
                                {conversationMessages.length === 0 ? (
                                    <Empty description="Bắt đầu cuộc trò chuyện..." />
                                ) : (
                                    conversationMessages.map((msg, index) => {
                                        const isAI = msg.speaker !== 'user';

                                        return (
                                            <div key={msg.id || index} className={`chat-bubble ${isAI ? 'ai' : 'user'}`}>
                                                <Avatar
                                                    size={40}
                                                    icon={isAI ? <RobotOutlined /> : <UserOutlined />}
                                                    style={{
                                                        backgroundColor: isAI ? '#FF9C00' : '#0075F3'
                                                    }}
                                                />
                                                <div className="bubble-content">
                                                    <p className="bubble-text">{msg.message}</p>
                                                    {msg.audio_url && (
                                                        <div style={{ marginTop: 8 }}>
                                                            <Button
                                                                type="text"
                                                                size="small"
                                                                icon={<PlayCircleOutlined />}
                                                                onClick={() => {
                                                                    const fullUrl = conversationService.getFullAudioUrl(msg.audio_url);
                                                                    if (fullUrl) {
                                                                        const audio = new Audio(fullUrl);
                                                                        audio.play().catch(err => console.error('Play error:', err));
                                                                    }
                                                                }}
                                                            >
                                                                Phát
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                {isAITyping && (
                                    <div className="chat-bubble ai">
                                        <Avatar size={40} icon={<RobotOutlined />} style={{ backgroundColor: '#FF9C00' }} />
                                        <div className="bubble-content">
                                            <Text type="secondary">AI đang soạn tin nhắn...</Text>
                                        </div>
                                    </div>
                                )}

                                <div ref={chatEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="chat-controls">
                                <Space.Compact style={{ width: '100%' }}>
                                    <TextArea
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        onPressEnter={(e) => {
                                            if (!e.shiftKey) {
                                                e.preventDefault();
                                                handleSendText();
                                            }
                                        }}
                                        placeholder="Nhập tin nhắn hoặc bấm mic để nói..."
                                        autoSize={{ minRows: 1, maxRows: 3 }}
                                        style={{ flex: 1 }}
                                    />
                                    <Button
                                        type="primary"
                                        icon={<SendOutlined />}
                                        onClick={handleSendText}
                                        disabled={!textInput.trim()}
                                    >
                                        Gửi
                                    </Button>
                                    <Button
                                        type={isRecording ? 'danger' : 'default'}
                                        icon={<AudioOutlined />}
                                        onClick={handleMicClick}
                                        loading={isRecording}
                                    >
                                        {isRecording ? 'Dừng' : 'Mic'}
                                    </Button>
                                    {currentSession && (
                                        <Button
                                            icon={<ReloadOutlined />}
                                            onClick={() => interruptAI()}
                                            title="Ngắt AI"
                                        />
                                    )}
                                </Space.Compact>
                            </div>
                        </div>
                    </Col>

                    {/* CỘT PHẢI: INFO & HELP */}
                    <Col xs={24} md={8}>
                        <div className="sidebar-right">
                            {currentScenario && (
                                (() => {
                                    const topicUI = getTopicUI(currentScenario.topic);
                                    const levelUI = getLevelUI(currentScenario.level);
                                    const levelInfo = levelsWithUI.find(l => l.value === currentScenario.level);

                                    return (
                                        <>
                                            <Card title="Thông tin kịch bản" size="small" style={{ marginBottom: 16 }}>
                                                <Space direction="vertical" style={{ width: '100%' }}>
                                                    {currentScenario.topic && (
                                                        <div>
                                                            <Text strong>Chủ đề: </Text>
                                                            <Tag color={topicUI.color}>
                                                                {topicUI.icon} {currentScenario.topic.replace(/_/g, ' ')}
                                                            </Tag>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <Text strong>Trình độ: </Text>
                                                        <Tag color={levelUI.color}>
                                                            {levelUI.icon} {levelInfo?.label || currentScenario.level}
                                                        </Tag>
                                                    </div>
                                                    {currentScenario.difficulty && (
                                                        <div>
                                                            <Text strong>Độ khó: </Text>
                                                            <Tag color="purple">
                                                                <FireOutlined /> {currentScenario.difficulty}/5
                                                            </Tag>
                                                        </div>
                                                    )}
                                                    {currentScenario.duration && (
                                                        <div>
                                                            <Text strong>Thời lượng: </Text>
                                                            <Text>~{currentScenario.duration} phút</Text>
                                                        </div>
                                                    )}
                                                    {currentScenario.learning_objectives && currentScenario.learning_objectives.length > 0 && (
                                                        <div>
                                                            <Text strong>Mục tiêu học tập:</Text>
                                                            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                                                                {currentScenario.learning_objectives.map((obj, idx) => (
                                                                    <li key={idx}><Text>{obj}</Text></li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </Space>
                                            </Card>

                                            {currentScenario.key_vocabulary && currentScenario.key_vocabulary.length > 0 && (
                                                <Card title="Từ vựng quan trọng" size="small">
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                        {currentScenario.key_vocabulary.map((vocab, idx) => (
                                                            <Tag key={idx} color="blue">{vocab}</Tag>
                                                        ))}
                                                    </div>
                                                </Card>
                                            )}
                                        </>
                                    );
                                })()
                            )}
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

export default Conversation;
