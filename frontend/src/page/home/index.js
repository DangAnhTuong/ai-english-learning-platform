import { Row, Col, Button, Card, Spin, Rate, Tag, Empty, Alert, Modal, message, Collapse } from 'antd';
import { NavLink, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import {
    ArrowRightOutlined, AudioOutlined,
    CheckCircleFilled, ClusterOutlined, DashboardOutlined,
    RightOutlined, RobotOutlined, StarFilled,
    BookOutlined, UserOutlined, CommentOutlined,
    ThunderboltFilled, FireFilled, SoundOutlined,
    SafetyCertificateFilled, GlobalOutlined, TrophyFilled,
    QuestionCircleOutlined, ReloadOutlined, PlayCircleFilled
} from '@ant-design/icons';
import { courseService } from '../../services/courseService';
import { conversationService } from '../../services/conversationService';
import { subscriptionService } from '../../services/subscriptionService';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
import "./style.css";

const TOPIC_ICON_MAP = {
    'restaurant': '🍽️', 'shopping': '🛍️', 'job_interview': '💼',
    'travel': '✈️', 'business_meeting': '🏢', 'medical_appointment': '🏥',
    'education': '🎓', 'friendship': '👥', 'family': '👨‍👩‍👧‍👦',
    'hobbies': '🎨', 'sports': '⚽', 'technology': '💻',
    'food': '🍔', 'weather': '🌤️', 'health': '💪',
    'movies': '🎬', 'music': '🎵', 'work': '💼',
    'daily_life': '🏠', 'school': '📚',
};

const SCENARIOS = [
    {
        id: 'interview',
        icon: '💼',
        tag: 'Phỏng Vấn Xin Việc',
        title: 'Tech Company Job Interview',
        company: 'Google / Shopee Senior Role',
        aiRole: 'Senior Hiring Manager',
        aiAvatar: '👩‍💼',
        aiMessage: 'Could you walk me through a challenging technical problem you solved recently?',
        studentMessage: 'Certainly. In my recent role, our real-time WebSocket connections experienced latency spikes during peak hours...',
        feedback: {
            score: 98,
            accent: 'Tự tin, ngữ điệu tự nhiên chuẩn bản xứ',
            highlights: ['Certainly', 'Latency spikes', 'Peak hours'],
            cefr: 'C1 Professional'
        }
    },
    {
        id: 'cafe',
        icon: '☕',
        tag: 'Order Đồ Uống',
        title: 'Starbucks Coffee & Bakery',
        company: 'Starbucks Downtown Seattle',
        aiRole: 'Head Barista',
        aiAvatar: '🧑‍🍳',
        aiMessage: 'Welcome to Starbucks! What can I get started for you today?',
        studentMessage: "Can I have an iced caramel macchiato with oat milk and less ice, please?",
        feedback: {
            score: 99,
            accent: 'Phát âm cực chuẩn âm /tʃ/ và /æ/',
            highlights: ['Caramel macchiato', 'Oat milk', 'Less ice'],
            cefr: 'B2 Everyday Native'
        }
    },
    {
        id: 'travel',
        icon: '✈️',
        tag: 'Sân Bay & Nhập Cảnh',
        title: 'Airport Immigration & Customs',
        company: 'Heathrow Airport London',
        aiRole: 'Border Control Officer',
        aiAvatar: '👮‍♂️',
        aiMessage: 'Good afternoon. What is the main purpose of your visit to the United Kingdom?',
        studentMessage: "I'm attending a three-day international AI education conference in London.",
        feedback: {
            score: 97,
            accent: 'Câu trả lời gãy gọn, đúng văn phong trang trọng',
            highlights: ['Attending', 'International conference', 'Purpose of visit'],
            cefr: 'B2+ Formal Fluency'
        }
    },
    {
        id: 'business',
        icon: '🏢',
        tag: 'Họp & Thuyết Trình',
        title: 'Quarterly Strategic Meeting',
        company: 'Global Business Review',
        aiRole: 'Product Director',
        aiAvatar: '👨‍💼',
        aiMessage: 'Let us examine our Q3 retention numbers. What key factor is driving this growth?',
        studentMessage: 'The primary driver is our newly launched AI speech simulator, which improved D30 retention by 24%.',
        feedback: {
            score: 98,
            accent: 'Thuật ngữ kinh doanh chính xác, phản xạ 0.3s',
            highlights: ['Primary driver', 'Newly launched', 'Retention by 24%'],
            cefr: 'C1 Executive'
        }
    }
];

const DEFAULT_PLANS = [
    {
        id: 'vip_1_month',
        name: 'Gói VIP Cơ Bản (1 Tháng)',
        price: 199000,
        duration: 30,
        durationLabel: '1 tháng',
        features: [
            'Luyện nói & đàm thoại 1-1 không giới hạn cùng AI',
            'Mở khóa trọn bộ 23+ kịch bản hội thoại thực tế',
            'Chấm điểm phát âm chuẩn bản xứ theo thời gian thực',
            'Tạo sơ đồ tư duy Mindmap bằng AI không giới hạn'
        ]
    },
    {
        id: 'vip_3_months',
        name: 'Gói VIP Tiêu Chuẩn (3 Tháng)',
        price: 499000,
        duration: 90,
        durationLabel: '3 tháng',
        popular: true,
        features: [
            'Trọn vẹn quyền lợi gói VIP trong 90 ngày',
            'Luyện hội thoại & Shadowing AI chuyên sâu',
            'Mở khóa toàn bộ khóa học Premium & Business English',
            'Luyện phản xạ thời gian thực qua WebSocket AI',
            'Huy hiệu VIP Gold học viên ưu tú'
        ]
    },
    {
        id: 'vip_12_months',
        name: 'Gói VIP Trọn Gói (1 Năm)',
        price: 899000,
        duration: 365,
        durationLabel: '1 năm',
        features: [
            'Tiết kiệm tối đa — Chỉ 75.000đ / tháng',
            'Đặc quyền truy cập sớm mọi tính năng AI mới nhất',
            'Gia sư AI kèm 1-1 chuẩn bị phỏng vấn & thuyết trình',
            'Chứng chỉ hoàn thành lộ trình chuẩn CEFR',
            'Hỗ trợ ưu tiên 24/7 từ chuyên viên học thuật'
        ]
    }
];

const DEFAULT_COURSES = [
    {
        _id: 'c1',
        title: 'Business English B1: Giao Tiếp & Thuyết Trình Công Sở',
        shortDescription: 'Làm chủ các mẫu câu đàm phán, viết email chuyên nghiệp và dẫn dắt cuộc họp cùng đồng nghiệp quốc tế.',
        level: 'B1 Intermediate',
        enrollmentType: 'paid',
        price: 299000,
        averageRating: 5,
        enrolledStudents: 1240,
        thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80'
    },
    {
        _id: 'c2',
        title: 'Tiếng Anh Giao Tiếp Hàng Ngày: Từ Mất Gốc Đến Tự Tin',
        shortDescription: 'Luyện phản xạ đời sống với 20+ kịch bản ăn uống, mua sắm, du lịch và kết bạn cùng gia sư AI.',
        level: 'A2 Foundation',
        enrollmentType: 'free',
        price: 0,
        averageRating: 4.9,
        enrolledStudents: 3520,
        thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80'
    },
    {
        _id: 'c3',
        title: 'Chinh Phục Phỏng Vấn Tiếng Anh Vào Tập Đoàn Đa Quốc Gia',
        shortDescription: 'Bí quyết trả lời các câu hỏi khó của nhà tuyển dụng theo phương pháp STAR cùng giám đốc nhân sự AI.',
        level: 'B2 Upper-Int',
        enrollmentType: 'paid',
        price: 399000,
        averageRating: 5,
        enrolledStudents: 890,
        thumbnail: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80'
    }
];

const DEFAULT_TOPICS = [
    { key: 'job_interview', title: 'Phỏng Vấn Xin Việc', count: '14 hội thoại', icon: '💼' },
    { key: 'business_meeting', title: 'Đàm Phán & Họp Công Sở', count: '18 hội thoại', icon: '🏢' },
    { key: 'restaurant', title: 'Nhà Hàng & Ẩm Thực', count: '22 hội thoại', icon: '🍽️' },
    { key: 'travel', title: 'Sân Bay & Du Lịch', count: '16 hội thoại', icon: '✈️' },
    { key: 'daily_life', title: 'Đời Sống Hàng Ngày', count: '30 hội thoại', icon: '🏠' },
    { key: 'shopping', title: 'Mua Sắm & Mặc Cả', count: '12 hội thoại', icon: '🛍️' },
    { key: 'technology', title: 'Công Nghệ & AI', count: '15 hội thoại', icon: '💻' },
    { key: 'sports', title: 'Thể Thao & Sở Thích', count: '10 hội thoại', icon: '⚽' }
];

function Home() {
    const navigate = useNavigate();
    const [featuredCourses, setFeaturedCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [plans, setPlans] = useState([]);
    const [topics, setTopics] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);
    const [isHeroPlaying, setIsHeroPlaying] = useState(true);

    const isLogin = useSelector((state) => state.auth.isLogin);
    const user = useSelector((state) => state.auth.user);

    const displayPlans = useMemo(() => (plans.length > 0 ? plans : DEFAULT_PLANS), [plans]);
    const displayCourses = useMemo(() => (featuredCourses.length > 0 ? featuredCourses : DEFAULT_COURSES), [featuredCourses]);

    useEffect(() => {
        loadFeaturedCourses();
        loadPlans();
        loadTopics();
    }, []);

    const handleTrialClick = () => {
        if (!isLogin) {
            Modal.confirm({
                title: 'Yêu cầu đăng nhập',
                content: 'Bạn cần đăng nhập bằng tài khoản học viên để bắt đầu sử dụng bản dùng thử 5 phút. Bạn có muốn Đăng nhập ngay không?',
                okText: 'Đăng nhập',
                cancelText: 'Hủy',
                onOk: () => navigate('/login')
            });
            return;
        }

        const isStaff = user?.roles?.some(role => ['admin', 'teacher'].includes(role));
        const hasPurchased = !!user?.activeSubscriptionId;

        if (isStaff || hasPurchased) {
            navigate('/conversation');
            return;
        }

        Modal.confirm({
            title: 'Bắt đầu dùng thử AI 5 phút',
            content: 'Bạn sẽ được trải nghiệm miễn phí toàn bộ các tính năng AI (Luyện Hội Thoại, Chat Box, Mindmap) trong 5 phút. Bạn đã sẵn sàng chưa?',
            okText: 'Bắt đầu ngay',
            cancelText: 'Để sau',
            onOk: () => {
                const trialEndTime = Date.now() + 5 * 60 * 1000;
                localStorage.setItem('trialEndTime', trialEndTime);
                message.success('Đã kích hoạt 5 phút dùng thử!');
                navigate('/conversation');
            }
        });
    };

    const loadFeaturedCourses = async () => {
        try {
            setLoadingCourses(true);
            const response = await courseService.getFeaturedCourses();
            if (response.success && response.data) {
                setFeaturedCourses(response.data.courses?.slice(0, 6) || []);
            }
        } catch (error) {
            console.error('Load featured courses error:', error);
        } finally {
            setLoadingCourses(false);
        }
    };

    const loadPlans = async () => {
        try {
            const response = await subscriptionService.getPlans();
            if (response.success && response.data) {
                setPlans(response.data);
            }
        } catch (error) {
            console.error('Load plans error:', error);
        }
    };

    const loadTopics = async () => {
        try {
            const response = await conversationService.getTopics();
            if (response.success && response.data) {
                setTopics(response.data);
            }
        } catch (error) {
            console.error('Load topics error:', error);
        }
    };

    const capitalizeWords = (str) => {
        if (!str) return '';
        return str
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const topicsWithIcon = useMemo(() => {
        return topics.map(topic => {
            const key = topic.name?.toLowerCase().replace(/\s+/g, '_');
            return {
                key,
                title: capitalizeWords(topic.name),
                count: `${topic.count || 0} hội thoại`,
                icon: TOPIC_ICON_MAP[key] || '💬'
            };
        });
    }, [topics]);

    const displayedTopics = isExpanded ? topicsWithIcon : topicsWithIcon.slice(0, 8);
    const finalTopics = displayedTopics.length > 0 ? displayedTopics : DEFAULT_TOPICS;

    const formatPrice = (price, currency = 'VND') => {
        if (!price || price === 0) return 'Miễn phí';
        return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
    };

    const formatPriceVND = (price) => {
        if (!price) return '0đ';
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    };

    const handleRegister = (pkg) => {
        navigate('/payment', {
            state: {
                selectedPackage: {
                    id: pkg.id,
                    name: pkg.name,
                    price: pkg.price,
                    duration: Math.round(pkg.duration / 30),
                    plan: pkg.type
                }
            }
        });
    };

    return (
        <div className="vibrant-home-wrapper">
            <Helmet>
                <title>Học Tiếng Anh AI - Xóa Bỏ Nỗi Sợ Giao Tiếp Bản Xứ</title>
                <meta name="description" content="Nền tảng luyện tiếng Anh giao tiếp 1-1 cùng AI thông minh. Chấm điểm phát âm chuẩn bản xứ, phản xạ thời gian thực và sơ đồ tư duy Mindmap." />
            </Helmet>

            {/* ========================================================
                1. HERO SECTION 2.0: LIVE AI SPEECH SIMULATOR
            ======================================================== */}
            <section className="vibrant-hero-section">
                <div className="hero-glow-blob blob-primary"></div>
                <div className="hero-glow-blob blob-secondary"></div>
                <div className="hero-glow-blob blob-accent"></div>

                <div className="container">
                    <Row gutter={[48, 48]} align="middle">
                        {/* CỘT TRÁI: TIÊU ĐỀ & CTA */}
                        <Col xs={24} lg={12} className="hero-text-col">
                            <div className="hero-badge">
                                <span className="pulsing-dot"></span>
                                <span className="badge-text">GIA SƯ TIẾNG ANH AI 1-1 THẾ HỆ MỚI</span>
                            </div>

                            <h1 className="hero-headline">
                                Xóa Bỏ Mọi Nỗi Sợ <br />
                                <span className="gradient-highlight">Nói Tiếng Anh</span> <br />
                                Cùng AI Bản Xứ
                            </h1>

                            <p className="hero-subtext">
                                Luyện đàm thoại phản xạ 1-1 bất kỳ lúc nào. Không sợ sai, không phán xét,
                                công nghệ nhận diện giọng nói Deepgram & AI phản hồi tự nhiên trong <strong>0.3 giây</strong>.
                            </p>

                            <div className="hero-cta-group">
                                <Button
                                    type="primary"
                                    size="large"
                                    className="btn-vibrant-primary"
                                    onClick={handleTrialClick}
                                >
                                    <ThunderboltFilled /> Học Thử Miễn Phí 5 Phút
                                </Button>
                                <Button
                                    size="large"
                                    className="btn-vibrant-secondary"
                                    onClick={() => {
                                        const el = document.getElementById('scenarios-section');
                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                >
                                    <PlayCircleFilled /> Xem Kịch Bản Thực Tế
                                </Button>
                            </div>

                            {/* SOCIAL PROOF CHIPS */}
                            <div className="hero-social-proof">
                                <div className="avatar-group">
                                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80" alt="student 1" />
                                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" alt="student 2" />
                                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80" alt="student 3" />
                                    <div className="avatar-more">+10k</div>
                                </div>
                                <div className="proof-text">
                                    <div className="stars-row">
                                        <StarFilled style={{ color: '#F59E0B' }} />
                                        <StarFilled style={{ color: '#F59E0B' }} />
                                        <StarFilled style={{ color: '#F59E0B' }} />
                                        <StarFilled style={{ color: '#F59E0B' }} />
                                        <StarFilled style={{ color: '#F59E0B' }} />
                                        <span className="rating-num">4.9/5</span>
                                    </div>
                                    <div className="active-now-tag">
                                        <span className="live-dot"></span> 158+ học viên đang luyện nói trực tiếp
                                    </div>
                                </div>
                            </div>
                        </Col>

                        {/* CỘT PHẢI: INTERACTIVE AI SPEECH CARD (SPEAK.COM STYLE) */}
                        <Col xs={24} lg={12} className="hero-widget-col">
                            <div className="ai-voice-simulator-card">
                                {/* CARD HEADER */}
                                <div className="card-coach-header">
                                    <div className="coach-avatar-box">
                                        <img
                                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
                                            alt="Sarah Native Coach"
                                            className="coach-img"
                                        />
                                        <span className="coach-status-dot"></span>
                                    </div>
                                    <div className="coach-details">
                                        <div className="coach-name">Sarah (Gia sư AI Bản Xứ California)</div>
                                        <div className="coach-subtitle">Deepgram Nova-2 Voice Engine • Thời gian thực</div>
                                    </div>
                                    <div className="live-badge">
                                        <span className="pulse-signal"></span> LIVE AI
                                    </div>
                                </div>

                                {/* AI MESSAGE BUBBLE */}
                                <div className="chat-bubble ai-bubble">
                                    <div className="bubble-speaker">
                                        <SoundOutlined className="speaker-icon" /> AI Coach
                                    </div>
                                    <div className="bubble-content">
                                        "Hey Tuong! Let's practice ordering at a coffee shop. What can I get for you today?"
                                    </div>
                                </div>

                                {/* LIVE WAVEFORM ANIMATION */}
                                <div className="waveform-container">
                                    <div className="waveform-label">
                                        <span>Đang lắng nghe giọng nói của bạn...</span>
                                        <span className="sample-rate">16kHz Stereo</span>
                                    </div>
                                    <div className={`waveform-visualizer ${isHeroPlaying ? 'active' : ''}`}>
                                        {[40, 75, 55, 90, 65, 80, 45, 95, 85, 60, 70, 50, 85, 65, 45, 75].map((h, i) => (
                                            <span
                                                key={i}
                                                className="waveform-bar"
                                                style={{
                                                    '--bar-height': `${h}%`,
                                                    '--bar-delay': `${i * 0.08}s`
                                                }}
                                            ></span>
                                        ))}
                                    </div>
                                </div>

                                {/* STUDENT MESSAGE BUBBLE */}
                                <div className="chat-bubble student-bubble">
                                    <div className="bubble-speaker">
                                        <UserOutlined /> Bạn (Học viên)
                                    </div>
                                    <div className="bubble-content">
                                        "I'd like an iced caramel macchiato with oat milk and less ice, please."
                                    </div>
                                </div>

                                {/* FLOATING AI EVALUATION METRICS */}
                                <div className="ai-feedback-chips">
                                    <div className="feedback-chip chip-score">
                                        <span className="chip-icon">🎯</span>
                                        <div>
                                            <div className="chip-title">Phát âm 98/100</div>
                                            <div className="chip-desc">Âm /tʃ/ và /θ/ rất chuẩn</div>
                                        </div>
                                    </div>

                                    <div className="feedback-chip chip-speed">
                                        <span className="chip-icon">⚡</span>
                                        <div>
                                            <div className="chip-title">Phản xạ 0.3s</div>
                                            <div className="chip-desc">Tự nhiên, không ậm ừ</div>
                                        </div>
                                    </div>

                                    <div className="feedback-chip chip-cefr">
                                        <span className="chip-icon">🏆</span>
                                        <div>
                                            <div className="chip-title">CEFR Level B2+</div>
                                            <div className="chip-desc">Giao tiếp lưu loát</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            </section>

            {/* ========================================================
                2. STATS & REPUTATION BAR (TÍNH BẢO CHỨNG CAO)
            ======================================================== */}
            <section className="vibrant-stats-bar">
                <div className="container">
                    <Row gutter={[24, 24]} justify="center" align="middle">
                        <Col xs={12} sm={6}>
                            <div className="stat-card-item">
                                <div className="stat-number">50,000+</div>
                                <div className="stat-label">Hội thoại AI hoàn thành</div>
                            </div>
                        </Col>
                        <Col xs={12} sm={6}>
                            <div className="stat-card-item">
                                <div className="stat-number">98.6%</div>
                                <div className="stat-label">Tăng phản xạ sau 30 ngày</div>
                            </div>
                        </Col>
                        <Col xs={12} sm={6}>
                            <div className="stat-card-item">
                                <div className="stat-number">23+</div>
                                <div className="stat-label">Kịch bản đàm thoại thực tế</div>
                            </div>
                        </Col>
                        <Col xs={12} sm={6}>
                            <div className="stat-card-item">
                                <div className="stat-number">&lt; 0.5s</div>
                                <div className="stat-label">Phản hồi AI tức thì</div>
                            </div>
                        </Col>
                    </Row>

                    <div className="tech-badge-row">
                        <span className="tech-tag">🚀 Deepgram Nova-2 ASR</span>
                        <span className="tech-tag">🧠 OpenAI GPT-4o Voice</span>
                        <span className="tech-tag">🎓 Khung Chuẩn CEFR Châu Âu</span>
                        <span className="tech-tag">💳 Tự Động Kích Hoạt VietQR MB Bank</span>
                    </div>
                </div>
            </section>

            {/* ========================================================
                3. INTERACTIVE SCENARIO SWITCHER (CHỌN TÌNH HUỐNG THỰC TẾ)
            ======================================================== */}
            <section id="scenarios-section" className="vibrant-scenarios-section">
                <div className="container">
                    <div className="section-head-center">
                        <div className="badge-pill">TRẢI NGHIỆM ĐA TÌNH HUỐNG</div>
                        <h2 className="section-title">Học Những Thứ Bạn Thực Sự Cần Dùng</h2>
                        <p className="section-subtitle">
                            Luyện tập trực tiếp các tình huống giao tiếp đời sống và công sở hàng ngày. Bấm chọn tình huống để xem mẫu hội thoại:
                        </p>
                    </div>

                    {/* TABS CHUYỂN ĐỔI KỊCH BẢN */}
                    <div className="scenario-tabs-nav">
                        {SCENARIOS.map((item) => (
                            <button
                                key={item.id}
                                className={`scenario-tab-btn ${activeScenario.id === item.id ? 'active' : ''}`}
                                onClick={() => setActiveScenario(item)}
                            >
                                <span className="tab-icon">{item.icon}</span>
                                <span className="tab-title">{item.tag}</span>
                            </button>
                        ))}
                    </div>

                    {/* KHUNG PREVIEW NỘI DUNG KỊCH BẢN */}
                    <div className="scenario-preview-box">
                        <Row gutter={[32, 32]} align="middle">
                            <Col xs={24} md={14}>
                                <div className="scenario-info-col">
                                    <div className="scenario-badge-label">
                                        <Tag color="blue">{activeScenario.title}</Tag>
                                        <span className="company-name">{activeScenario.company}</span>
                                    </div>

                                    {/* AI SPEECH */}
                                    <div className="dialogue-block ai-dialogue">
                                        <div className="avatar-circle">{activeScenario.aiAvatar}</div>
                                        <div className="dialogue-text">
                                            <div className="role-title">{activeScenario.aiRole} (AI)</div>
                                            <div className="sentence">"{activeScenario.aiMessage}"</div>
                                        </div>
                                    </div>

                                    {/* STUDENT SPEECH */}
                                    <div className="dialogue-block student-dialogue">
                                        <div className="avatar-circle">🗣️</div>
                                        <div className="dialogue-text">
                                            <div className="role-title">Bạn (Người học)</div>
                                            <div className="sentence">"{activeScenario.studentMessage}"</div>
                                        </div>
                                    </div>

                                    {/* KEY VOCABULARY TAGS */}
                                    <div className="key-vocab-row">
                                        <span className="vocab-label">Từ vựng & Cụm từ then chốt:</span>
                                        {activeScenario.feedback.highlights.map((w, idx) => (
                                            <span key={idx} className="highlight-tag">{w}</span>
                                        ))}
                                    </div>
                                </div>
                            </Col>

                            <Col xs={24} md={10}>
                                <div className="scenario-metrics-col">
                                    <div className="score-meter-card">
                                        <div className="meter-header">
                                            <TrophyFilled style={{ color: '#F59E0B', fontSize: 24 }} />
                                            <span>Đánh Giá AI Chi Tiết</span>
                                        </div>
                                        <div className="big-score">
                                            {activeScenario.feedback.score}<span>/100</span>
                                        </div>
                                        <div className="score-comment">
                                            <CheckCircleFilled style={{ color: '#10B981' }} /> {activeScenario.feedback.accent}
                                        </div>
                                        <div className="cefr-badge-box">
                                            Khung năng lực: <strong>{activeScenario.feedback.cefr}</strong>
                                        </div>

                                        <Button
                                            type="primary"
                                            size="large"
                                            className="btn-try-scenario"
                                            onClick={() => navigate('/conversation')}
                                        >
                                            Luyện Kịch Bản Này Ngay <ArrowRightOutlined />
                                        </Button>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </div>
            </section>

            {/* ========================================================
                4. BENTO GRID: CÔNG NGHỆ & TÍNH NĂNG VƯỢT TRỘI
            ======================================================== */}
            <section className="vibrant-bento-section">
                <div className="container">
                    <div className="section-head-center">
                        <div className="badge-pill">CÔNG NGHỆ TIÊN PHONG</div>
                        <h2 className="section-title">Học Tiếng Anh Toàn Diện Cùng AI</h2>
                        <p className="section-subtitle">Phương pháp tiếp cận khoa học, phối hợp đa giác quan giúp bạn thẩm thấu ngôn ngữ tự nhiên.</p>
                    </div>

                    <div className="bento-grid-container">
                        {/* BENTO 1: LUYỆN NÓI THỜI GIAN THỰC (LARGE 2 COLS) */}
                        <div className="bento-card bento-large">
                            <div className="bento-content">
                                <div className="bento-icon-tag bg-blue">
                                    <AudioOutlined /> Hội Thoại Trực Tiếp
                                </div>
                                <h3>Luyện Nói 1-1 Không Giới Hạn Thời Gian Thực</h3>
                                <p>
                                    Tương tác mượt mà qua WebSocket tốc độ cao. AI đóng vai người bản xứ,
                                    phản hồi tự nhiên và chỉnh sửa phát âm ngay tức thì khi bạn dứt câu.
                                </p>
                                <ul className="bento-feature-list">
                                    <li><CheckCircleFilled style={{ color: '#10B981' }} /> Tự do ngắt lời & phản biện như người thật</li>
                                    <li><CheckCircleFilled style={{ color: '#10B981' }} /> Không áp lực tâm lý, không lo sợ nói sai</li>
                                </ul>
                                <Link to="/conversation" className="bento-link">
                                    Trải nghiệm phòng luyện nói <ArrowRightOutlined />
                                </Link>
                            </div>
                            <div className="bento-visual visual-chat">
                                <div className="mini-chat-preview">
                                    <div className="msg msg-ai">"Let's order some food!"</div>
                                    <div className="msg msg-user">"A chicken burger, please."</div>
                                    <div className="tag-score">⚡ 0.3s Latency</div>
                                </div>
                            </div>
                        </div>

                        {/* BENTO 2: TỪ VỰNG MINDMAP (1 COL) */}
                        <div className="bento-card bento-standard">
                            <div className="bento-icon-tag bg-emerald">
                                <ClusterOutlined /> Sơ Đồ Tư Duy
                            </div>
                            <h3>Từ Vựng Mindmap AI</h3>
                            <p>
                                Tạo mạng lưới từ vựng theo chủ đề chỉ với 1 cú click. Giúp não bộ kết nối ngữ nghĩa và nhớ lâu gấp 3 lần cách học truyền thống.
                            </p>
                            <Link to="/mindmap" className="bento-link">
                                Khám phá Mindmap <ArrowRightOutlined />
                            </Link>
                        </div>

                        {/* BENTO 3: PHÂN TÍCH PHÁT ÂM (1 COL) */}
                        <div className="bento-card bento-standard">
                            <div className="bento-icon-tag bg-purple">
                                <RobotOutlined /> Chấm Điểm IPA
                            </div>
                            <h3>Chấm Điểm & Khẩu Hình</h3>
                            <p>
                                AI phân tích từng âm vị IPA, chỉ rõ từ nào phát âm thiếu trọng âm, nuốt âm hay sai đuôi /s/, /ed/ để bạn cải thiện triệt để.
                            </p>
                            <Link to="/chatbox" className="bento-link">
                                Chat phản xạ ngay <ArrowRightOutlined />
                            </Link>
                        </div>

                        {/* BENTO 4: LỘ TRÌNH & GAMIFICATION (LARGE 2 COLS) */}
                        <div className="bento-card bento-wide">
                            <div className="bento-content">
                                <div className="bento-icon-tag bg-orange">
                                    <FireFilled /> Chuỗi Học Tập
                                </div>
                                <h3>Lộ Trình Cá Nhân Hóa Chuẩn CEFR</h3>
                                <p>
                                    Theo dõi tiến độ từ A1 đến C1 qua từng mốc ngày. Duy trì ngọn lửa Streak mỗi ngày để nhận huy hiệu và thăng cấp trình độ giao tiếp.
                                </p>
                                <div className="streak-badge-row">
                                    <span className="badge-flame">🔥 14 Days Streak</span>
                                    <span className="badge-level">🏅 Level: Intermediate B1</span>
                                    <span className="badge-xp">⚡ +450 XP Tuần Này</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================
                5. FEATURED COURSES (KHÓA HỌC NỔI BẬT TỪ API)
            ======================================================== */}
            <section className="vibrant-courses-section">
                <div className="container">
                    <div className="section-head-between">
                        <div>
                            <div className="badge-pill">LỘ TRÌNH CHUYÊN SÂU</div>
                            <h2 className="section-title">Khóa Học Nổi Bật Được Yêu Thích</h2>
                        </div>
                        <Button
                            type="primary"
                            size="large"
                            className="btn-view-all"
                            onClick={() => navigate('/courses')}
                        >
                            Xem Tất Cả Khóa Học <ArrowRightOutlined />
                        </Button>
                    </div>

                    {loadingCourses ? (
                        <div className="loading-box">
                            <Spin size="large" />
                        </div>
                    ) : displayCourses.length === 0 ? (
                        <div className="empty-courses-card">
                            <Empty description="Đang cập nhật khóa học mới từ giảng viên" />
                        </div>
                    ) : (
                        <Row gutter={[24, 24]}>
                            {displayCourses.map(course => (
                                <Col xs={24} sm={12} md={8} key={course._id || course.id}>
                                    <div
                                        className="vibrant-course-card"
                                        onClick={() => navigate(`/courses/${course._id || course.id}`)}
                                    >
                                        <div
                                            className="course-thumb"
                                            style={{
                                                backgroundImage: course.thumbnail
                                                    ? `url(${course.thumbnail})`
                                                    : 'linear-gradient(135deg, #0066FF 0%, #00C6FF 100%)'
                                            }}
                                        >
                                            <div className="course-badges">
                                                {course.level && <span className="badge-level-tag">{course.level}</span>}
                                                {course.enrollmentType === 'free' ? (
                                                    <span className="badge-free">Miễn Phí</span>
                                                ) : (
                                                    <span className="badge-pro">VIP Pro</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="course-info">
                                            <h4 className="course-title">{course.title}</h4>
                                            <p className="course-desc">
                                                {course.shortDescription || course.description}
                                            </p>

                                            <div className="course-footer">
                                                <div className="rating-wrap">
                                                    <Rate disabled defaultValue={course.averageRating || 5} allowHalf style={{ fontSize: 13 }} />
                                                    <span className="students-count">
                                                        <UserOutlined /> {course.enrolledStudents || 0}
                                                    </span>
                                                </div>
                                                <div className="price-tag">
                                                    {formatPrice(course.price, course.currency)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    )}
                </div>
            </section>

            {/* ========================================================
                6. TOPICS CHỦ ĐỀ HỘI THOẠI (DYNAMIC TỪ API)
            ======================================================== */}
            <section className="vibrant-topics-section">
                <div className="container">
                    <div className="section-head-center">
                        <div className="badge-pill">KHO ĐỀ TÀI VÔ HẠN</div>
                        <h2 className="section-title">Khám Phá Các Chủ Đề Thực Hành</h2>
                        <p className="section-subtitle">Hơn 23+ kịch bản phong phú từ giao tiếp thường nhật đến phỏng vấn và công sở quốc tế.</p>
                    </div>

                    {finalTopics.length === 0 ? (
                        <div className="loading-box">
                            <Spin />
                        </div>
                    ) : (
                        <Row gutter={[16, 16]}>
                            {finalTopics.map((item, index) => (
                                <Col xs={12} sm={8} md={6} key={item.key || index}>
                                    <div
                                        className="vibrant-topic-card"
                                        onClick={() => navigate('/conversation')}
                                    >
                                        <div className="topic-emoji">{item.icon}</div>
                                        <div className="topic-content">
                                            <div className="topic-name">{item.title}</div>
                                            <div className="topic-count">{item.count}</div>
                                        </div>
                                        <RightOutlined className="arrow-icon" />
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    )}

                    {topicsWithIcon.length > 8 && (
                        <div className="topics-expand-wrap">
                            <Button
                                className="btn-expand-topics"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? "Thu Gọn Danh Sách" : `Xem Tất Cả ${topicsWithIcon.length} Chủ Đề`}
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* ========================================================
                7. CEFR AI TEST BANNER
            ======================================================== */}
            <section className="vibrant-test-banner-section">
                <div className="container">
                    <div className="test-banner-wrapper">
                        <Row gutter={[40, 40]} align="middle">
                            <Col xs={24} md={15}>
                                <div className="test-banner-left">
                                    <div className="banner-badge">
                                        <StarFilled /> BÀI TEST CHUẨN QUỐC TẾ CEFR
                                    </div>
                                    <h2 className="banner-title">
                                        Bạn Chưa Biết Mình Đang Ở Mức Nào?
                                    </h2>
                                    <p className="banner-desc">
                                        Dành 15 phút thực hiện bài kiểm tra phản xạ & phát âm toàn diện.
                                        AI sẽ lập tức chấm điểm, chỉ ra điểm mạnh, điểm yếu và xây dựng lộ trình học dành riêng cho bạn.
                                    </p>
                                    <NavLink to="/ai-test">
                                        <Button size="large" className="btn-start-test">
                                            Làm Bài Kiểm Tra Ngay (Miễn Phí) <ArrowRightOutlined />
                                        </Button>
                                    </NavLink>
                                </div>
                            </Col>
                            <Col xs={24} md={9} className="test-banner-right">
                                <div className="score-circle-widget">
                                    <DashboardOutlined className="widget-icon" />
                                    <div className="circle-label">CEFR AI Test</div>
                                    <div className="circle-score">A1 ➔ C1</div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </div>
            </section>

            {/* ========================================================
                8. VIP PRICING: KẾT NỐI VIETQR TỰ ĐỘNG
            ======================================================== */}
            <section className="vibrant-pricing-section">
                <div className="container">
                    <div className="section-head-center">
                        <div className="badge-pill">BẢNG GIÁ ƯU ĐÃI</div>
                        <h2 className="section-title">Chọn Gói Học Phù Hợp Với Bạn</h2>
                        <p className="section-subtitle">
                            Đầu tư nhỏ cho sự tự tin trọn đời. Tích hợp chuyển khoản <strong>VietQR tự động kích hoạt VIP trong 3-5 giây</strong>.
                        </p>
                    </div>

                    <div className="pricing-cards-row">
                        {displayPlans.map((pkg, index) => {
                            const isPopular = pkg.id === 'vip_3_months' || index === 1;
                            return (
                                <div
                                    key={pkg.id}
                                    className={`pricing-box ${isPopular ? 'popular-card' : ''}`}
                                    onClick={() => handleRegister(pkg)}
                                >
                                    {isPopular && (
                                        <div className="popular-ribbon">
                                            🔥 KHUYÊN DÙNG — TIẾT KIỆM 30%
                                        </div>
                                    )}

                                    <div className="pricing-box-header">
                                        <h3 className="package-title">{pkg.name}</h3>
                                        <div className="price-number">
                                            {formatPriceVND(pkg.price)}
                                            <span className="price-period">/ {pkg.durationLabel || `${Math.round(pkg.duration / 30)} tháng`}</span>
                                        </div>
                                    </div>

                                    <ul className="package-features">
                                        {(pkg.features || [
                                            'Luyện nói 1-1 không giới hạn cùng AI',
                                            'Mở khóa trọn bộ 23+ kịch bản hội thoại',
                                            'Chấm điểm phát âm chuẩn bản xứ theo thời gian thực',
                                            'Tạo sơ đồ tư duy Mindmap không giới hạn',
                                            'Huy hiệu VIP Gold học viên ưu tú'
                                        ]).map((feat, i) => (
                                            <li key={i}>
                                                <CheckCircleFilled style={{ color: '#10B981', marginRight: 10 }} />
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button className="btn-choose-plan">
                                        Đăng Ký & Quét Mã VietQR <ArrowRightOutlined />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ========================================================
                9. FAQ ACCORDION (GIẢI ĐÁP THẮC MẮC)
            ======================================================== */}
            <section className="vibrant-faq-section">
                <div className="container">
                    <div className="section-head-center">
                        <div className="badge-pill">HỎI ĐÁP NHANH</div>
                        <h2 className="section-title">Câu Hỏi Thường Gặp</h2>
                    </div>

                    <div className="faq-accordion-wrap">
                        <Collapse
                            bordered={false}
                            defaultActiveKey={['1']}
                            items={[
                                {
                                    key: '1',
                                    label: <span className="faq-question">Bản dùng thử 5 phút hoạt động như thế nào?</span>,
                                    children: <p className="faq-answer">Sau khi đăng nhập tài khoản học viên, bạn có thể bấm "Học thử miễn phí 5 phút". Hệ thống sẽ mở khóa toàn bộ quyền năng của AI để bạn thoải mái luyện nói, thử thách kịch bản và chat phản xạ trước khi quyết định nâng cấp.</p>
                                },
                                {
                                    key: '2',
                                    label: <span className="faq-question">Thanh toán chuyển khoản VietQR bao lâu thì tài khoản lên VIP?</span>,
                                    children: <p className="faq-answer">Hệ thống liên kết trực tiếp với cổng SePay và ngân hàng MB Bank. Khi bạn chuyển khoản đúng mã đơn hàng, tài khoản sẽ được tự động kích hoạt VIP trong 3-5 giây mà không cần chờ duyệt thủ công.</p>
                                },
                                {
                                    key: '3',
                                    label: <span className="faq-question">Công nghệ AI nhận diện giọng nói có chính xác không?</span>,
                                    children: <p className="faq-answer">Nền tảng sử dụng Deepgram Nova-2 ASR kết hợp mô hình phân tích âm vị IPA chuyên sâu, cho độ chính xác nhận diện trên 98% và bắt lỗi phát âm cực kỳ nhạy bén.</p>
                                },
                                {
                                    key: '4',
                                    label: <span className="faq-question">Người mất gốc có học được không?</span>,
                                    children: <p className="faq-answer">Hoàn toàn được! AI rất kiên nhẫn, không phán xét và có tính năng dịch nghĩa tiếng Việt, gợi ý mẫu câu đơn giản từ mức độ A1 để bạn xây dựng phản xạ từ con số 0.</p>
                                }
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* ========================================================
                10. FINAL CTA: BỨT PHÁ GIAO TIẾP
            ======================================================== */}
            <section className="vibrant-final-cta-section">
                <div className="container">
                    <div className="final-cta-card">
                        <div className="cta-content">
                            <h2 className="cta-headline">Sẵn Sàng Làm Chủ Tiếng Anh Giao Tiếp?</h2>
                            <p className="cta-sub">
                                Tham gia cùng hơn 10.000 học viên bứt phá phản xạ nói tiếng Anh mỗi ngày cùng AI.
                            </p>
                            <Link to="/register">
                                <Button size="large" className="btn-cta-white">
                                    Tạo Tài Khoản Học Viên Ngay <ArrowRightOutlined />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;
