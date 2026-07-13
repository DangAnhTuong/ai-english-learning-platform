import { Row, Col, Button, Card, Spin, Rate, Tag, Empty, Alert, Modal, message } from 'antd';
import { NavLink, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react'
import {
    ArrowRightOutlined, AudioOutlined,
    CheckCircleFilled, ClusterOutlined, DashboardOutlined,
    RightOutlined, RobotOutlined, StarFilled,
    BookOutlined, UserOutlined, CommentOutlined
} from '@ant-design/icons';
import { courseService } from '../../services/courseService';
import { conversationService } from '../../services/conversationService';
import { subscriptionService } from '../../services/subscriptionService';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
import s1 from "../../img/nentienganhmain.jpg";
import "./style.css"; 

/**
 * Icon mapping cho topics - dùng để hiển thị icon trên UI
 * Key là tên topic (lowercase, underscore), value là emoji
 */
const TOPIC_ICON_MAP = {
    'restaurant': '🍽️', 'shopping': '🛍️', 'job_interview': '💼',
    'travel': '✈️', 'business_meeting': '🏢', 'medical_appointment': '🏥',
    'education': '🎓', 'friendship': '👥', 'family': '👨‍👩‍👧‍👦',
    'hobbies': '🎨', 'sports': '⚽', 'technology': '💻',
    'food': '🍔', 'weather': '🌤️', 'health': '💪',
    'movies': '🎬', 'music': '🎵', 'work': '💼',
    'daily_life': '🏠', 'school': '📚',
};

function Home() {
    const navigate = useNavigate();
    const [featuredCourses, setFeaturedCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [plans, setPlans] = useState([]);
    const [topics, setTopics] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);

    const isLogin = useSelector((state) => state.auth.isLogin);
    const user = useSelector((state) => state.auth.user);

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
            // Đã là Premium hoặc Staff thì vào thẳng
            navigate('/conversation');
            return;
        }

        // Kích hoạt Trial 5 phút
        Modal.confirm({
            title: 'Bắt đầu dùng thử AI',
            content: 'Bạn sẽ được trải nghiệm miễn phí toàn bộ các tính năng AI (Luyện Hội Thoại, Chat Box, Mindmap) trong vòng 5 phút. Bạn đã sẵn sàng chưa?',
            okText: 'Bắt đầu ngay',
            cancelText: 'Để sau',
            onOk: () => {
                const trialEndTime = Date.now() + 5 * 60 * 1000; // 5 phút
                localStorage.setItem('trialEndTime', trialEndTime);
                message.success('Đã kích hoạt 5 phút dùng thử!');
                navigate('/conversation');
            }
        });
    };

    // Lấy khóa học nổi bật từ API
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

    // Lấy gói cước từ backend API /subscriptions/plans
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

    // Lấy danh sách chủ đề hội thoại từ backend API /conversations/topics
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

    // Capitalize chuẩn cho tiếng Việt
    const capitalizeWords = (str) => {
        if (!str) return '';
        return str
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Xây dựng danh sách topics hiển thị với icon
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

    const formatPrice = (price, currency = 'VND') => {
        if (!price || price === 0) return 'Miễn phí';
        return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
    };

    const formatPriceVND = (price) => {
        if (!price) return '0đ';
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    };

    // Chuyển hướng đến trang thanh toán với gói đã chọn
    const handleRegister = (pkg) => {
        navigate('/payment', { 
            state: { 
                selectedPackage: {   
                    id: pkg.id,
                    name: pkg.name, 
                    price: pkg.price, 
                    duration: Math.round(pkg.duration / 30), // days -> months
                    plan: pkg.type
                }
            } 
        });
    };

    return (
        <>
            <Helmet>
                <title>Học Tiếng Anh AI - Xóa Bỏ Nỗi Sợ Giao Tiếp</title>
                <meta name="description" content="Luyện tập tiếng Anh giao tiếp 1-1 cùng AI. Nền tảng học tiếng Anh thông minh với Chatbot, Mindmap, và lộ trình cá nhân hóa." />
                <meta name="keywords" content="học tiếng anh ai, tiếng anh giao tiếp, luyện nói tiếng anh, app học tiếng anh" />
            </Helmet>

            {/* 1. HERO SECTION */}
            <div className="section1">
    <div className="container">
        <Row justify="space-between" align="middle" gutter={[40, 40]}>
            {/* CỘT CHỮ */}
            <Col xs={24} md={12} lg={12} className="col-text">
                <div className="content-wrapper">
                    <h3 className="sub-title">Tiếng Anh Giao Tiếp 4.0</h3>
                    
                    <h1 className="main-title">
                        Xóa Bỏ Nỗi Sợ <br />
                        <span className="highlight-text">Nói Tiếng Anh !</span>
                    </h1>

                    <p className="description">
                        Luyện tập hội thoại 1-1 cùng AI bất cứ lúc nào. <br/>
                        Không sợ sai, không áp lực, sửa lỗi phát âm ngay lập tức.
                    </p>

                    <div className="tags-wrapper">
                        <span className="tag-item">
                            <CheckCircleFilled style={{ color: '#0075F3' }} /> Thực hành hội thoại 1:1
                        </span>
                        <span className="tag-item">
                            <CheckCircleFilled style={{ color: '#0075F3' }} /> Phản xạ tự nhiên
                        </span>
                    </div>

                    <Button type="primary" size="large" className="btn-orange" onClick={handleTrialClick}>
                        Học thử miễn phí <RightOutlined />
                    </Button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
    <div style={{ display: 'flex' }}>
        <img src="https://i.pravatar.cc/100?img=1" alt="user" style={{ width: 35, height: 35, borderRadius: '50%', border: '2px solid white' }} />
        <img src="https://i.pravatar.cc/100?img=2" alt="user" style={{ width: 35, height: 35, borderRadius: '50%', border: '2px solid white', marginLeft: '-15px' }} />
        <img src="https://i.pravatar.cc/100?img=3" alt="user" style={{ width: 35, height: 35, borderRadius: '50%', border: '2px solid white', marginLeft: '-15px' }} />
        <div style={{ width: 35, height: 35, borderRadius: '50%', border: '2px solid white', marginLeft: '-15px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>10k+</div>
    </div>
    <span style={{ fontSize: '14px', color: '#666' }}>Học viên đã tham gia</span>
</div>
                </div>
            </Col>

            {/* CỘT ẢNH */}
            <Col xs={24} md={12} lg={12} className="col-img">
                <div className="img-wrapper">
                    <img src={s1} alt="Banner Tiếng Anh AI" />
                </div>
            </Col>
        </Row>
    </div>
</div>

            {/* 2. FEATURES SECTION */}
            <div className="section2">
                <div className="container">
                    <div className="section-title">
                        <h2>Học tiếng Anh toàn diện</h2>
                        <p>Công nghệ AI giúp bạn bứt phá mọi kỹ năng</p>
                    </div>
                    <Row gutter={[30, 30]} justify="center">
                        <Col xs={24} sm={12} md={8}>
                            <div className="feature-card">
                                <div className="icon-box icon-blue"><AudioOutlined /></div>
                                <h3>Luyện Hội Thoại</h3>
                                <p>Đóng vai cùng AI trong các tình huống thực tế. Chỉnh sửa phát âm chuẩn bản xứ ngay lập tức.</p>
                                <Link to="/conversation" className="learn-more">
                                    Học ngay <ArrowRightOutlined />
                                </Link>
                            </div>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <div className="feature-card">
                                <div className="icon-box icon-green"><ClusterOutlined /></div>
                                <h3>Từ Vựng Mindmap</h3>
                                <p>Học từ vựng theo sơ đồ tư duy. Hiểu sâu mối liên hệ giữa các từ, nhớ lâu hơn gấp 3 lần.</p>
                                <Link to="/mindmap" className="learn-more">
                                    Khám phá <ArrowRightOutlined />
                                </Link>
                            </div>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <div className="feature-card">
                                <div className="icon-box icon-purple"><RobotOutlined /></div>
                                <h3>Chat Phản Xạ AI</h3>
                                <p>Trò chuyện tự do với trợ lý ảo thông minh. Rèn luyện khả năng phản xạ và tư duy ngôn ngữ.</p>
                                <Link to="/chatbox" className="learn-more">
                                    Chat ngay <ArrowRightOutlined />
                                </Link>
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>

            {/* 3. FEATURED COURSES SECTION */}
            <div className="section-featured-courses" style={{ padding: '60px 0', background: '#f5f5f5' }}>
                <div className="container">
                    <div className="section-title">
                        <h2>Khóa học nổi bật</h2>
                        <p>Những khóa học được đánh giá cao nhất từ cộng đồng</p>
                    </div>
                    {loadingCourses ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <Spin size="large" />
                        </div>
                    ) : featuredCourses.length === 0 ? (
                        <>
                            <Alert
                                type="info"
                                showIcon
                                style={{ marginBottom: 16 }}
                                message="Hiện chưa có khóa học nổi bật từ backend."
                                description="Đây là dữ liệu thật từ API. Khi có khóa học public/published, mục này sẽ tự hiển thị."
                            />
                            <Empty description="Chưa có khóa học nổi bật" />
                        </>
                    ) : (
                        <Row gutter={[24, 24]} className="mobile-scroll-row">
                            {featuredCourses.map(course => (
                                <Col xs={24} sm={12} md={8} key={course._id || course.id}>
                                    <Card
                                        hoverable
                                        style={{ height: '100%', borderRadius: 8 }}
                                        cover={
                                            <div
                                                style={{
                                                    height: 160,
                                                    background: course.thumbnail
                                                        ? `url(${course.thumbnail}) center/cover`
                                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: 40,
                                                }}
                                                onClick={() => navigate(`/courses/${course._id || course.id}`)}
                                            >
                                                {!course.thumbnail && <BookOutlined />}
                                            </div>
                                        }
                                        onClick={() => navigate(`/courses/${course._id || course.id}`)}
                                    >
                                        <div>
                                            <div style={{ marginBottom: 8 }}>
                                                {course.level && <Tag>{course.level}</Tag>}
                                                {course.enrollmentType === 'free' && <Tag color="green">Miễn phí</Tag>}
                                            </div>
                                            <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, minHeight: 48 }}>
                                                {course.title}
                                            </h3>
                                            <p
                                                style={{
                                                    fontSize: 13,
                                                    color: '#666',
                                                    marginBottom: 12,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {course.shortDescription || course.description}
                                            </p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                <Rate disabled defaultValue={course.averageRating || 0} allowHalf style={{ fontSize: 12 }} />
                                                <span style={{ fontSize: 11, color: '#999' }}>
                                                    <UserOutlined /> {course.enrolledStudents || 0}
                                                </span>
                                            </div>
                                            <div style={{ textAlign: 'right', marginTop: 12 }}>
                                                <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>
                                                    {formatPrice(course.price, course.currency)}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                    <div style={{ textAlign: 'center', marginTop: 30 }}>
                        <Button type="primary" size="large" onClick={() => navigate('/courses')}>
                            Xem tất cả khóa học <ArrowRightOutlined />
                        </Button>
                    </div>
                </div>
            </div>

            {/* 4. TOPICS SECTION - Lấy động từ API */}
            <div className="section3">
            <div className="container">
                <div className="section-title">
                    <h2>Chủ đề đa dạng</h2>
                    <p>Lựa chọn lộ trình phù hợp với mục tiêu của bạn</p>
                </div>
                
                {topicsWithIcon.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <CommentOutlined style={{ fontSize: 48, color: '#ccc' }} />
                        <p style={{ color: '#999', marginTop: 16 }}>Đang tải danh sách chủ đề...</p>
                    </div>
                ) : (
                    <Row gutter={[20, 20]} className="mobile-scroll-row">
                        {displayedTopics.map((item, index) => (
                            <Col xs={12} sm={8} md={6} key={item.key || index}>
                                <div 
                                    className="topic-card" 
                                    onClick={() => navigate('/conversation')} 
                                    style={{ cursor: 'pointer' }}          
                                >
                                    <div className="topic-icon"><CommentOutlined /></div>
                                    <div className="topic-info">
                                        <h4>{item.title}</h4>
                                        <span>{item.count}</span>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                )}
                
                {topicsWithIcon.length > 8 && (
                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                        <Button 
                            className="btn-outline" 
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? "Thu gọn danh sách" : `Xem tất cả ${topicsWithIcon.length} chủ đề`}
                        </Button>
                    </div>
                )}
            </div>
        </div>

            {/* 5. TEST BANNER */}
            <div className="section-test">
                <div className="container">
                    <div className="test-banner">
                        <Row align="middle" gutter={[30, 30]}>
                            <Col xs={24} md={14}>
                                <div className="test-content">
                                    <span className="badge-test"> <StarFilled /> Được đề xuất</span>
                                    <h2>Bạn không biết bắt đầu từ đâu?</h2>
                                    <p>
                                        Dành 15 phút làm bài kiểm tra năng lực chuẩn CEFR.
                                        AI sẽ phân tích điểm mạnh, điểm yếu và thiết kế lộ trình học riêng biệt cho bạn.
                                    </p>
                                    <NavLink to="/ai-test">
                                    <Button type="primary" size="large" className="btn-white-outline">
                                        Làm bài kiểm tra ngay <ArrowRightOutlined />
                                    </Button>
                                    </NavLink>
                                    
                                </div>
                            </Col>
                            <Col xs={24} md={10}>
                                <div className="test-image-box">
                                    <div className="score-circle">
                                        <DashboardOutlined style={{ fontSize: '60px', color: '#fff' }} />
                                        <div className="score-text">AI Test</div>
                                    </div>
                                    <div className="decor-dot dot-1"></div>
                                    <div className="decor-dot dot-2"></div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </div>
            </div>

            {/* 6. PRICING SECTION - Lấy từ API /subscriptions/plans */}
            <div className="home-pricing-section">
                <div className="container">
                    <h2 className="pricing-title">Chọn lộ trình thành công</h2>
                    <p className="pricing-subtitle">Đầu tư nhỏ cho kết quả lớn. Bắt đầu ngay hôm nay!</p>

                    <div className="pricing-container">
                        {plans.map((pkg, index) => (
                            <div key={pkg.id} className="pricing-card" onClick={() => handleRegister(pkg)}>
                                {/* Dùng index để tạo class: theme-0, theme-1, theme-2 */}
                                <div className={`card-header theme-${index}`}>
                                    {pkg.name?.toUpperCase()}
                                </div>
                                {pkg.discount && <div className="discount-badge">-{pkg.discount}%</div>}
                                <div className="card-body">
                                    <div className="price-text">{formatPriceVND(pkg.price)}</div>
                                    <div className="price-duration">/ {pkg.durationLabel || `${Math.round(pkg.duration / 30)} tháng`}</div>
                                    <ul className="feature-list">
                                        {(pkg.features || []).map((feat, i) => (
                                            <li key={i}>
                                                <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                    {/* Dùng index cho nút bấm */}
                                    <button className={`btn-choose theme-${index}`}>
                                        Đăng ký ngay
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 7. CTA FINAL */}
            <div className="section4-cta">
    <div className="container">
        <Row justify="center" align="middle">
            <Col xs={24} md={16} className="text-center">
                <h2>Sẵn sàng bứt phá Tiếng Anh ngay hôm nay?</h2>
                <p>Tham gia cộng đồng hơn 10.000 học viên và trải nghiệm công nghệ AI tiên tiến nhất.</p>
                
                <Link to="/register">
                    <Button type="primary" size="large" className="btn-white">
                        Đăng ký tài khoản miễn phí
                    </Button>
                </Link>

            </Col>
        </Row>
    </div>
</div>
        </>
    );
}

export default Home;