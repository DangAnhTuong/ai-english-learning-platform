import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Button, Spin, Tag, Rate, Descriptions, Tabs, Empty,
  Avatar, Divider, message, Progress, Collapse, List, Input, Modal
} from 'antd';
import {
  BookOutlined, ClockCircleOutlined, UserOutlined, StarFilled,
  PlayCircleOutlined, CheckCircleOutlined, LockOutlined, PlusOutlined
} from '@ant-design/icons';
import { courseService } from '../../services/courseService';
import { useSelector } from 'react-redux';
import './style.css';

const { TabPane } = Tabs;

function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isLogin, user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [courseProgress, setCourseProgress] = useState(0);

  useEffect(() => {
    loadCourseDetail();
  }, [courseId]);

  const loadCourseDetail = async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourseById(courseId);
      
      if (response.success && response.data) {
        const courseData = response.data.course || response.data;
        setCourse(courseData);
        if (courseData.isEnrolled) {
            setEnrolled(true);
            loadProgress();
        }
      }
    } catch (error) {
      console.error('Load course detail error:', error);
      message.error('Không thể tải thông tin khóa học');
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const response = await courseService.getCourseProgress(courseId);
      if (response.success && response.data) {
        setCompletedLessons(response.data.completedLessons || []);
        if (response.data.enrollment && response.data.enrollment.progress) {
          setCourseProgress(response.data.enrollment.progress.completionPercentage || 0);
        }
      }
    } catch (error) {
      console.error('Load progress error:', error);
    }
  };

  const handleCompleteLesson = async (lessonId) => {
    try {
      const res = await courseService.completeLesson(courseId, lessonId);
      if (res.success) {
        message.success('Đã hoàn thành bài học!');
        loadProgress();
      }
    } catch (error) {
      message.error('Lỗi khi cập nhật tiến độ');
    }
  };

  const handleEnroll = async () => {
    if (!isLogin) {
      Modal.confirm({
        title: 'Đăng nhập để tiếp tục',
        content: 'Bạn cần đăng nhập để đăng ký khóa học này.',
        okText: 'Đăng nhập',
        cancelText: 'Hủy',
        onOk: () => navigate('/login'),
      });
      return;
    }

    try {
      setEnrolling(true);
      const response = await courseService.enrollInCourse(courseId);
      
      if (response.success) {
        message.success('Đăng ký khóa học thành công!');
        setEnrolled(true);
        navigate('/my-courses');
      }
    } catch (error) {
      console.error('Enroll error:', error);
      const errorMsg = error.response?.data?.error || 'Không thể đăng ký khóa học';
      message.error(errorMsg);
    } finally {
      setEnrolling(false);
    }
  };

  const formatPrice = (price, currency = 'VND') => {
    if (!price || price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  const getEnrollmentTypeTag = (type) => {
    const colors = {
      free: 'green',
      paid: 'orange',
      premium: 'gold',
    };
    const labels = {
      free: 'Miễn phí',
      paid: 'Trả phí',
      premium: 'Premium',
    };
    return <Tag color={colors[type]} style={{ fontSize: 14, padding: '4px 12px' }}>
      {labels[type] || type}
    </Tag>;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!course) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Empty description="Không tìm thấy khóa học" />
      </div>
    );
  }

  return (
    <div className="course-detail-page">
      <div className="container" style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Header Section */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col xs={24} md={16}>
              <div style={{ marginBottom: 16 }}>
                {getEnrollmentTypeTag(course.enrollmentType)}
                {course.level && <Tag>{course.level}</Tag>}
                {course.difficulty && <Tag>{course.difficulty}</Tag>}
              </div>

              {enrolled && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 'bold' }}>Tiến độ học tập</span>
                    <span>{courseProgress}%</span>
                  </div>
                  <Progress percent={courseProgress} status={courseProgress === 100 ? "success" : "active"} showInfo={false} />
                </div>
              )}

              <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 16 }}>
                {course.title}
              </h1>
              <p style={{ fontSize: 16, color: '#666', marginBottom: 20 }}>
                {course.description}
              </p>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
                <div>
                  <Rate disabled defaultValue={course.averageRating || 0} allowHalf />
                  <span style={{ marginLeft: 8 }}>
                    ({course.totalRatings || 0} đánh giá)
                  </span>
                </div>
                <div>
                  <UserOutlined /> {course.enrolledStudents || 0} học viên
                </div>
                {course.totalLessons > 0 && (
                  <div>
                    <BookOutlined /> {course.totalLessons} bài học
                  </div>
                )}
                {course.totalDuration > 0 && (
                  <div>
                    <ClockCircleOutlined /> {course.totalDuration} phút
                  </div>
                )}
              </div>
              {course.creator && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar src={course.creator.avatar} icon={<UserOutlined />} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{course.creator.name}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>Giảng viên</div>
                  </div>
                </div>
              )}
            </Col>
            <Col xs={24} md={8}>
              <Card style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff', marginBottom: 8 }}>
                  {formatPrice(course.price, course.currency)}
                </div>
                {enrolled ? (
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<PlayCircleOutlined />}
                    onClick={() => navigate('/my-courses')}
                  >
                    Tiếp tục học
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    block
                    loading={enrolling}
                    onClick={handleEnroll}
                  >
                    {course.enrollmentType === 'free' ? 'Đăng ký miễn phí' : 'Đăng ký ngay'}
                  </Button>
                )}
                <Divider />
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Trình độ">{course.level || 'N/A'}</Descriptions.Item>
                  <Descriptions.Item label="Độ khó">{course.difficulty || 'N/A'}</Descriptions.Item>
                  <Descriptions.Item label="Danh mục">{course.category || 'N/A'}</Descriptions.Item>
                  <Descriptions.Item label="Bài học">{course.totalLessons || 0}</Descriptions.Item>
                  <Descriptions.Item label="Thời lượng">{course.totalDuration || 0} phút</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* Content Tabs */}
        <Card>
          <Tabs defaultActiveKey="1">
            <TabPane tab="Tổng quan" key="1">
              <div style={{ padding: '20px 0' }}>
                {course.learningObjectives && course.learningObjectives.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ marginBottom: 16 }}>Mục tiêu học tập</h3>
                    <ul style={{ paddingLeft: 20 }}>
                      {course.learningObjectives.map((obj, idx) => (
                        <li key={idx} style={{ marginBottom: 8 }}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {course.targetAudience && course.targetAudience.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ marginBottom: 16 }}>Đối tượng phù hợp</h3>
                    <ul style={{ paddingLeft: 20 }}>
                      {course.targetAudience.map((aud, idx) => (
                        <li key={idx} style={{ marginBottom: 8 }}>{aud}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {course.prerequisites && course.prerequisites.length > 0 && (
                  <div>
                    <h3 style={{ marginBottom: 16 }}>Yêu cầu trước</h3>
                    <ul style={{ paddingLeft: 20 }}>
                      {course.prerequisites.map((pre, idx) => (
                        <li key={idx} style={{ marginBottom: 8 }}>{pre}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabPane>
            <TabPane tab="Nội dung khóa học" key="2">
              <div style={{ padding: '20px 0' }}>
                {course.modules && course.modules.length > 0 ? (
                  <Collapse defaultActiveKey={['0']}>
                    {course.modules.map((module, idx) => (
                      <Collapse.Panel 
                        header={<span style={{ fontWeight: 'bold' }}>Module {idx + 1}: {module.title || module.name || `Module ${idx + 1}`}</span>} 
                        key={idx.toString()}
                      >
                        <p style={{ color: '#666', marginBottom: 16 }}>{module.description || 'Chưa có mô tả'}</p>
                        {module.lessons && module.lessons.length > 0 ? (
                          <List
                            itemLayout="horizontal"
                            dataSource={module.lessons}
                            renderItem={lesson => {
                                const isCompleted = completedLessons.includes(lesson._id);
                                return (
                                  <List.Item
                                    actions={enrolled ? [
                                      isCompleted 
                                      ? <Tag color="green"><CheckCircleOutlined /> Hoàn thành</Tag>
                                      : <Button size="small" type="primary" onClick={() => handleCompleteLesson(lesson._id)}>Đánh dấu hoàn thành</Button>
                                    ] : []}
                                  >
                                    <List.Item.Meta
                                      avatar={<Avatar icon={lesson.type === 'video' ? <PlayCircleOutlined /> : <BookOutlined />} />}
                                      title={lesson.title}
                                      description={lesson.description || `${lesson.duration || 0} phút`}
                                    />
                                  </List.Item>
                                );
                            }}
                          />
                        ) : (
                          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có bài học nào" />
                        )}
                      </Collapse.Panel>
                    ))}
                  </Collapse>
                ) : (
                  <Empty description="Chưa có nội dung khóa học" />
                )}
              </div>
            </TabPane>
            <TabPane tab="Đánh giá" key="3">
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <Empty description="Chưa có đánh giá nào" />
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

export default CourseDetail;
