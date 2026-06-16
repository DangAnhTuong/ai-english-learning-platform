import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, Typography, Space, Spin, Result, Progress, Row, Col, Steps, message } from 'antd';
import { AudioOutlined, CheckCircleOutlined, DashboardOutlined, SendOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './style.css';

const { Title, Text, Paragraph } = Typography;

// DATA: 4 Phần của bài thi chuẩn
const TEST_PARTS = [
    {
        id: 1,
        title: 'Phần 1: Giới thiệu bản thân',
        question: 'Please introduce yourself. What is your name, where are you from, and what do you do?',
        instruction: 'Hãy nói trong khoảng 30 giây để giới thiệu những thông tin cơ bản về bạn.',
        image: null
    },
    {
        id: 2,
        title: 'Phần 2: Trả lời câu hỏi',
        question: 'Do you prefer reading books or watching movies? Why?',
        instruction: 'Đưa ra quan điểm cá nhân và giải thích lý do cụ thể.',
        image: null
    },
    {
        id: 3,
        title: 'Phần 3: Mô tả tranh',
        question: 'Please describe what you see in this picture.',
        instruction: 'Mô tả không gian, con người và những hoạt động đang diễn ra trong bức tranh.',
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop' 
    },
    {
        id: 4,
        title: 'Phần 4: Thảo luận chủ đề',
        question: 'Some people think that technology is making us less sociable. Do you agree or disagree?',
        instruction: 'Đưa ra lập luận rõ ràng, có ví dụ chứng minh cho quan điểm của bạn.',
        image: null
    }
];

function AITest() {
    const navigate = useNavigate();
    
    // Quản lý trạng thái
    const [step, setStep] = useState('intro'); // 'intro', 'testing', 'processing', 'result'
    const [currentPartIndex, setCurrentPartIndex] = useState(0);
    const [recordedBlobs, setRecordedBlobs] = useState([]); // Lưu 4 file audio
    
    // Ghi âm
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const [testResult, setTestResult] = useState(null);

    // Đồng hồ đếm giờ
    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
            setRecordingTime(0);
        }
        return () => clearInterval(timerRef.current);
    }, [isRecording]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Bắt đầu thi (Vào phần 1)
    const startTest = () => {
        setStep('testing');
        setCurrentPartIndex(0);
        setRecordedBlobs([]);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = handleStopCurrentPart;
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (error) {
            message.error("Vui lòng cấp quyền sử dụng Micro để làm bài test!");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    // Xử lý khi kết thúc 1 phần thi
    const handleStopCurrentPart = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const newBlobs = [...recordedBlobs, audioBlob];
        setRecordedBlobs(newBlobs);

        // Nếu còn câu hỏi thì chuyển qua câu tiếp theo
        if (currentPartIndex < TEST_PARTS.length - 1) {
            setCurrentPartIndex(prev => prev + 1);
        } else {
            // Đã thi xong phần 4 -> Gửi API
            submitTestToAI(newBlobs);
        }
    };

    // GỌI API CHẤM ĐIỂM
    const submitTestToAI = async (blobs) => {
        setStep('processing');
        const formData = new FormData();
        
        // Nạp cả 4 file audio vào formData với cùng một tên key là 'audios'
        blobs.forEach((blob, index) => {
            formData.append('audios', blob, `part_${index + 1}.webm`);
        });

        try {
            const PYTHON_API_URL = process.env.REACT_APP_PYTHON_API_URL || 'http://localhost:8000';
            const response = await fetch(`${PYTHON_API_URL}/api/v1/ai-test/evaluate`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Lỗi từ server');
            const result = await response.json();
            setTestResult(result);
            setStep('result');
        } catch (error) {
            message.error("Có lỗi xảy ra khi phân tích. Vui lòng thử lại!");
            setStep('intro');
        }
    };

    const currentPart = TEST_PARTS[currentPartIndex];

    return (
        <div className="ai-test-page">
            <div className="ai-test-container">
                
                {/* MÀN HÌNH GIỚI THIỆU */}
                {step === 'intro' && (
                    <Card className="test-card intro-step">
                        <div className="icon-wrapper"><DashboardOutlined /></div>
                        <Title level={2}>Kiểm tra Năng lực (Full Test)</Title>
                        <Paragraph className="test-desc">
                            Bài thi chuẩn hóa gồm <b>4 phần</b>: Giới thiệu, Trả lời câu hỏi, Mô tả tranh và Thảo luận.<br/>
                            AI sẽ đánh giá toàn diện Từ vựng, Ngữ pháp và Độ trôi chảy của bạn.
                        </Paragraph>

                        <Button type="primary" size="large" shape="round" onClick={startTest} className="btn-start-test">
                            Bắt đầu Bài Thi <RightOutlined />
                        </Button>
                    </Card>
                )}

                {/* MÀN HÌNH LÀM BÀI (4 BƯỚC) */}
                {step === 'testing' && (
                    <Card className="test-card">
                        <Steps current={currentPartIndex} size="small" style={{ marginBottom: 30 }}>
                            <Steps.Step title="Giới thiệu" />
                            <Steps.Step title="Hỏi đáp" />
                            <Steps.Step title="Mô tả tranh" />
                            <Steps.Step title="Thảo luận" />
                        </Steps>

                        <div className="question-box">
                            <Text type="secondary">{currentPart.title}</Text>
                            <Title level={3} style={{ color: '#0075F3', marginTop: 10 }}>
                                {currentPart.question}
                            </Title>
                            <Text italic>{currentPart.instruction}</Text>
                            
                            {/* Hiển thị tranh cho phần 3 */}
                            {currentPart.image && (
                                <div style={{ marginTop: 20 }}>
                                    <img src={currentPart.image} alt="Test" style={{ maxWidth: '100%', height: 250, borderRadius: 8, objectFit: 'cover' }} />
                                </div>
                            )}
                        </div>

                        {!isRecording ? (
                            <Button type="primary" size="large" shape="round" icon={<AudioOutlined />} onClick={startRecording} style={{ background: '#52c41a' }}>
                                Bấm để Ghi âm trả lời
                            </Button>
                        ) : (
                            <div className="recording-active-box">
                                <div className="recording-indicator" style={{ margin: '20px auto' }}>
                                    <div className="pulse-ring"></div>
                                    <div className="mic-icon"><AudioOutlined /></div>
                                </div>
                                <div className="timer">{formatTime(recordingTime)}</div>
                                <Button type="primary" danger size="large" shape="round" onClick={stopRecording} icon={<SendOutlined />}>
                                    {currentPartIndex === 3 ? "Hoàn thành bài thi" : "Lưu & Tiếp tục"}
                                </Button>
                            </div>
                        )}
                    </Card>
                )}

                {/* MÀN HÌNH XỬ LÝ & KẾT QUẢ giữ nguyên như cũ... */}
                {step === 'processing' && (
                    <Card className="test-card processing-step">
                        <Spin size="large" />
                        <Title level={3} style={{ marginTop: 20 }}>AI Đang Chấm Điểm</Title>
                        <Paragraph type="secondary">
                            Hệ thống đang tổng hợp 4 phần thi, kiểm tra ngữ pháp và từ vựng...
                        </Paragraph>
                    </Card>
                )}

                {/* KẾT QUẢ */}
                {step === 'result' && testResult && (
                    <Card className="test-card result-step">
                        <Result
                            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            title="Hoàn thành Bài đánh giá năng lực!"
                            subTitle="Kết quả dựa trên Khung tham chiếu Châu Âu (CEFR)."
                        />

                        <div className="score-board">
                            <Row gutter={[20, 20]} align="middle">
                                <Col xs={24} md={8} style={{ textAlign: 'center' }}>
                                    <div className="cefr-badge">
                                        <h1>{testResult.level}</h1>
                                    </div>
                                    <Title level={4} style={{ marginTop: 10 }}>{testResult.title}</Title>
                                    <Text type="secondary">Điểm tổng quan: {testResult.score}/100</Text>
                                </Col>
                                <Col xs={24} md={16}>
                                    <div className="feedback-section">
                                        <Text strong style={{ color: '#52c41a' }}>Điểm mạnh:</Text>
                                        <ul>
                                            {testResult.strengths.map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                        
                                        <Text strong style={{ color: '#cf1322', marginTop: 10, display: 'block' }}>Cần khắc phục:</Text>
                                        <ul>
                                            {testResult.weaknesses.map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        <div className="recommendation-box">
                            <Title level={5}>💡 Gợi ý lộ trình từ AI:</Title>
                            <Paragraph>{testResult.recommendation}</Paragraph>
                        </div>

                        <Space size="middle" style={{ marginTop: 30 }}>
                            <Button size="large" shape="round" onClick={() => setStep('intro')}>Làm lại Test</Button>
                            <Button type="primary" size="large" shape="round" onClick={() => navigate('/conversation')}>
                                Bắt đầu Luyện tập
                            </Button>
                        </Space>
                    </Card>
                )}

            </div>
        </div>
    );
}

export default AITest;