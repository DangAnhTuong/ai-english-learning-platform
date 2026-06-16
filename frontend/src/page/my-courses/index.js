import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Button, Spin, Empty, Tag, Progress, message
} from 'antd';
import {
  PlayCircleOutlined, BookOutlined, ClockCircleOutlined,
  UserOutlined, RightOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { courseService } from '../../services/courseService';
import { useSelector } from 'react-redux';
import './style.css';

function MyCourses() {
  const navigate = useNavigate();
  const { isLogin } = useSelector((state) => state.auth);
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
      message.error('Không thể tải khóa học của bạn');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage < 30) return '#ff4d4f';
    if (percentage < 70) return '#faad14';
    return '#52c41a';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="my-courses-page">
      <div className="container" style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 30 }}>
          <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 10 }}>
            Khóa học của tôi
          </h1>
          <p style={{ fontSize: 16, color: '#666' }}>
            Tiếp tục học tập và theo dõi tiến độ của bạn
          </p>
        </div>

        {courses.length === 0 ? (
          <Card>
            <Empty
              description="Bạn chưa đăng ký khóa học nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={() => navigate('/courses')}>
                Khám phá khóa học
              </Button>
            </Empty>
          </Card>
        ) : (
          <Row gutter={[24, 24]}>
            {courses.map((item) => {
              const course = item.course || item;
              const enrollment = item.enrollment || {};
              const progress = enrollment.progress || {};
              const completionPercentage = progress.completionPercentage || 0;

              return (
                <Col xs={24} sm={12} lg={8} key={course._id || course.id}>
                  <Card
                    hoverable
                    style={{ height: '100%' }}
                    cover={
                      <div
                        style={{
                          height: 180,
                          background: course.thumbnail
                            ? `url(${course.thumbnail}) center/cover`
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 48,
                        }}
                      >
                        {!course.thumbnail && <BookOutlined />}
                      </div>
                    }
                    actions={[
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        block
                        onClick={() => navigate(`/courses/${course._id || course.id}`)}
                      >
                        {completionPercentage > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
                      </Button>,
                    ]}
                  >
                    <div>
                      <div style={{ marginBottom: 12 }}>
                        <Tag color={enrollment.status === 'completed' ? 'green' : 'blue'}>
                          {enrollment.status === 'completed' ? 'Hoàn thành' : 'Đang học'}
                        </Tag>
                        {course.level && <Tag>{course.level}</Tag>}
                      </div>
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 'bold',
                          marginBottom: 8,
                          minHeight: 48,
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/courses/${course._id || course.id}`)}
                      >
                        {course.title}
                      </h3>
                      
                      {/* Progress */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: '#666' }}>Tiến độ</span>
                          <span style={{ fontSize: 12, fontWeight: 'bold' }}>
                            {completionPercentage}%
                          </span>
                        </div>
                        <Progress
                          percent={completionPercentage}
                          strokeColor={getProgressColor(completionPercentage)}
                          showInfo={false}
                          size="small"
                        />
                      </div>

                      {/* Stats */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999', marginBottom: 8 }}>
                        {progress.completedLessons !== undefined && (
                          <span>
                            <CheckCircleOutlined /> {progress.completedLessons}/{progress.totalLessons || 0} bài học
                          </span>
                        )}
                        {enrollment.lastAccessDate && (
                          <span>
                            <ClockCircleOutlined /> {formatDate(enrollment.lastAccessDate)}
                          </span>
                        )}
                      </div>

                      {/* Enrollment Date */}
                      {enrollment.enrollmentDate && (
                        <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
                          Đăng ký: {formatDate(enrollment.enrollmentDate)}
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        {/* Browse More Courses */}
        {courses.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Button
              type="default"
              size="large"
              icon={<RightOutlined />}
              onClick={() => navigate('/courses')}
            >
              Khám phá thêm khóa học
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyCourses;
