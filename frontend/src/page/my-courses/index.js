import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Button, Spin, Empty, Tag, Progress,
  Typography, Space, Tooltip
} from 'antd';
import {
  PlayCircleOutlined, BookOutlined, ClockCircleOutlined,
  UserOutlined, RightOutlined, CheckCircleFilled,
  FireFilled, TrophyOutlined, ThunderboltOutlined,
  CompassOutlined
} from '@ant-design/icons';
import { courseService } from '../../services/courseService';
import { useSelector } from 'react-redux';
import './style.css';

const { Title, Text, Paragraph } = Typography;

function MyCourses() {
  const navigate = useNavigate();
  const { isLogin, user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    if (!isLogin) {
      navigate('/login');
      return;
    }
    loadEnrolledCourses();
  }, [isLogin]);

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true);
      const response = await courseService.getEnrolledCourses();
      if (response.success && response.data) {
        setCourses(response.data.courses || []);
      }
    } catch (error) {
      console.error('Load enrolled courses error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage < 35) return '#f59e0b';
    if (percentage < 75) return '#0072ff';
    return '#10b981';
  };

  if (loading) {
    return (
      <div className="my-courses-loading">
        <Spin size="large" tip="Đang tải lộ trình học của bạn..." />
      </div>
    );
  }

  // Calculate overall stats
  const totalCourses = courses.length;
  const avgProgress = totalCourses > 0
    ? Math.round(courses.reduce((acc, cur) => acc + (cur.enrollment?.progress?.completionPercentage || 0), 0) / totalCourses)
    : 0;

  return (
    <div className="my-courses-dashboard-page">
      <div className="my-courses-container">
        {/* Top Learner Stats Hero */}
        <div className="my-courses-hero">
          <Row align="middle" justify="space-between" gutter={[24, 24]}>
            <Col xs={24} md={15}>
              <div className="hero-welcome-badge">
                <ThunderboltOutlined style={{ marginRight: 6, color: '#00c6ff' }} /> DASHBOARD HỌC VIÊN
              </div>
              <Title level={2} className="my-courses-title">
                Khóa Học Của Tôi
              </Title>
              <Paragraph className="my-courses-subtitle">
                Chào mừng trở lại, <strong>{user?.name || 'Học viên'}</strong>! Hãy duy trì thói quen luyện nói tiếng Anh mỗi ngày cùng AI để đạt phản xạ tự nhiên.
              </Paragraph>

              <div className="learner-quick-metrics">
                <div className="quick-metric-item">
                  <span className="metric-val">{totalCourses}</span>
                  <span className="metric-lbl">Khóa đang học</span>
                </div>
                <div className="metric-sep"></div>
                <div className="quick-metric-item">
                  <span className="metric-val">{user?.currentStreak || 0}</span>
                  <span className="metric-lbl">Ngày liên tiếp 🔥</span>
                </div>
                <div className="metric-sep"></div>
                <div className="quick-metric-item">
                  <span className="metric-val">{avgProgress}%</span>
                  <span className="metric-lbl">Tiến độ chung</span>
                </div>
              </div>
            </Col>

            <Col xs={24} md={8} style={{ textAlign: 'center' }}>
              <div className="streak-cta-card">
                <TrophyOutlined style={{ fontSize: 40, color: '#f59e0b', marginBottom: 8 }} />
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>
                  {user?.isVip || user?.activeSubscriptionId ? 'Học Viên VIP Pro 👑' : 'Tài Khoản Tiêu Chuẩn'}
                </div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', margin: '4px 0 14px' }}>
                  Luyện nói AI không giới hạn thời lượng
                </Text>
                <Button
                  type="primary"
                  shape="round"
                  onClick={() => navigate('/courses')}
                  className="btn-explore-more"
                >
                  Khám phá thêm khóa học
                </Button>
              </div>
            </Col>
          </Row>
        </div>

        {/* Course List or Empty State */}
        <div className="courses-list-section">
          <div className="section-header-row">
            <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
              Lộ trình bài học đang theo dõi ({totalCourses})
            </Title>
            <Button type="link" onClick={() => navigate('/conversation')}>
              Vào phòng luyện nói AI →
            </Button>
          </div>

          {courses.length === 0 ? (
            <div className="empty-enrolled-box">
              <CompassOutlined style={{ fontSize: 60, color: '#0072ff', marginBottom: 16 }} />
              <Title level={4} style={{ color: '#0f172a', margin: 0 }}>
                Bạn chưa đăng ký khóa học nào!
              </Title>
              <Paragraph style={{ color: '#64748b', maxWidth: 480, margin: '8px auto 24px' }}>
                Hệ sinh thái khóa học thực chiến của English AI có đầy đủ lộ trình từ mất gốc đến tự tin giao tiếp quốc tế và luyện thi IELTS.
              </Paragraph>
              <Button
                type="primary"
                size="large"
                shape="round"
                className="btn-start-exploring"
                icon={<BookOutlined />}
                onClick={() => navigate('/courses')}
              >
                Khám Phá Kho Khóa Học Ngay
              </Button>
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {courses.map((item) => {
                const course = item.course || item;
                const enrollment = item.enrollment || {};
                const progress = enrollment.progress || {};
                const completionPercentage = progress.completionPercentage || 0;

                return (
                  <Col xs={24} sm={12} lg={8} key={course._id || course.id}>
                    <div className="my-course-card">
                      <div className="card-badge-row">
                        <Tag color="blue">{course.level || 'Cơ bản'}</Tag>
                        <span className="percent-tag" style={{ color: getProgressColor(completionPercentage) }}>
                          {completionPercentage}% Hoàn thành
                        </span>
                      </div>

                      <Title level={4} className="card-course-title" ellipsis={{ rows: 2 }}>
                        {course.title || 'Khóa học tiếng Anh AI'}
                      </Title>
                      <Paragraph className="card-course-desc" ellipsis={{ rows: 2 }}>
                        {course.description || 'Luyện tập giao tiếp thực chiến 1:1 cùng AI Simulator.'}
                      </Paragraph>

                      <div className="card-progress-bar-wrapper">
                        <Progress
                          percent={completionPercentage}
                          strokeColor={getProgressColor(completionPercentage)}
                          showInfo={false}
                          size="small"
                        />
                      </div>

                      <div className="card-footer-row">
                        <div className="lesson-count-tag">
                          <BookOutlined /> {course.totalLessons || 24} bài học
                        </div>
                        <Button
                          type="primary"
                          shape="round"
                          icon={<PlayCircleOutlined />}
                          className="btn-continue-learning"
                          onClick={() => navigate(`/conversation?topic=${course.topic || 'daily_life'}`)}
                        >
                          Tiếp tục học
                        </Button>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyCourses;
