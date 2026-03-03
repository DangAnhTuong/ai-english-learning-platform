import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Input, Select, Button, Spin, Empty, Pagination, Tag, Rate, message, Alert } from 'antd';
import { SearchOutlined, BookOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import api from '../../services/api';
import './style.css';

const { Search } = Input;
const { Option } = Select;

const FALLBACK_DIFFICULTIES = [
  { value: 'beginner', label: 'Cơ bản' },
  { value: 'elementary', label: 'Sơ cấp' },
  { value: 'intermediate', label: 'Trung cấp' },
  { value: 'upper_intermediate', label: 'Trung cao cấp' },
  { value: 'advanced', label: 'Nâng cao' },
  { value: 'proficient', label: 'Thành thạo' },
];

// Label mapping cho categories
const CATEGORY_LABELS = {
  grammar: 'Ngữ pháp', vocabulary: 'Từ vựng', listening: 'Nghe',
  speaking: 'Nói', reading: 'Đọc', writing: 'Viết',
  pronunciation: 'Phát âm', business: 'Tiếng Anh công sở',
  ielts: 'IELTS', toefl: 'TOEFL', conversation: 'Hội thoại',
};

function Courses() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
  });
  const [filters, setFilters] = useState({
    category: undefined,
    level: undefined,
    difficulty: undefined,
    enrollmentType: undefined,
    search: '',
  });

  // Dynamic filter options từ backend
  const [categories, setCategories] = useState([]);
  const [levels, setLevels] = useState([]);
  const [difficulties, setDifficulties] = useState(FALLBACK_DIFFICULTIES);

  // Load filter metadata từ backend
  useEffect(() => {
    loadFilterMetadata();
  }, []);

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, filters]);

  const loadFilterMetadata = async () => {
    try {
      // Load categories từ API /courses/categories
      const catRes = await courseService.getCategories();
      const categoriesFromApi = catRes.data?.categories || [];
      if (catRes.success && categoriesFromApi.length > 0) {
        const mappedCats = categoriesFromApi.map(cat => ({
          value: cat._id,
          label: CATEGORY_LABELS[cat._id] || cat._id.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
          count: cat.count || 0
        }));
        setCategories(mappedCats);
      }
    } catch (error) {
      console.error('Load categories error:', error);
    }

    try {
      // Load levels từ API /levels (public)
      const levelsRes = await api.get('/levels', { params: { isActive: true, sortBy: 'order', sortOrder: 'asc' } });
      if (levelsRes.data?.success && levelsRes.data?.data?.length > 0) {
        const mappedLevels = levelsRes.data.data.map(level => ({
          value: level.code,
          label: `${level.code} - ${level.name}`
        }));
        setLevels(mappedLevels);
      }
    } catch (error) {
      console.error('Load levels error:', error);
    }

    try {
      // Load difficulties động từ danh sách courses hiện có
      const coursesRes = await courseService.getCourses({}, { page: 1, limit: 200 });
      const coursesData = coursesRes?.data?.courses || [];
      const uniqueDifficulties = Array.from(
        new Set(
          coursesData
            .map(course => course?.difficulty)
            .filter(Boolean)
        )
      );

      if (uniqueDifficulties.length > 0) {
        const mappedDifficulties = uniqueDifficulties.map(diff => {
          const fallbackMatch = FALLBACK_DIFFICULTIES.find(item => item.value === diff);
          return {
            value: diff,
            label: fallbackMatch?.label || diff.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          };
        });
        setDifficulties(mappedDifficulties);
      }
    } catch (error) {
      console.error('Load difficulties error:', error);
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourses(filters, {
        page: pagination.page,
        limit: pagination.limit,
      });

      if (response.success && response.data) {
        setCourses(response.data.courses || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
        }));
      }
    } catch (error) {
      console.error('Load courses error:', error);
      message.error('Không thể tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    // Only set search if value is not empty
    setFilters(prev => ({ 
      ...prev, 
      search: value && value.trim() ? value.trim() : undefined 
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      category: undefined,
      level: undefined,
      difficulty: undefined,
      enrollmentType: undefined,
      search: undefined,
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== undefined && value !== '');
  }, [filters]);

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    return <Tag color={colors[type]}>{labels[type] || type}</Tag>;
  };

  return (
    <div className="courses-page">
      <div className="container" style={{ padding: '40px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 10 }}>
            Khóa học tiếng Anh
          </h1>
          <p style={{ fontSize: 16, color: '#666' }}>
            Khám phá hàng trăm khóa học chất lượng cao từ các giảng viên chuyên nghiệp
          </p>
        </div>

        {/* Filters */}
        <Card style={{ marginBottom: 30 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Tìm kiếm khóa học..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                onChange={(e) => !e.target.value && handleSearch('')}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Danh mục"
                allowClear
                size="large"
                style={{ width: '100%' }}
                value={filters.category}
                onChange={(value) => handleFilterChange('category', value)}
              >
                {categories.map(cat => (
                  <Option key={cat.value} value={cat.value}>
                    {cat.label}{cat.count ? ` (${cat.count})` : ''}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Trình độ"
                allowClear
                size="large"
                style={{ width: '100%' }}
                value={filters.level}
                onChange={(value) => handleFilterChange('level', value)}
              >
                {levels.map(level => (
                  <Option key={level.value} value={level.value}>{level.label}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Độ khó"
                allowClear
                size="large"
                style={{ width: '100%' }}
                value={filters.difficulty}
                onChange={(value) => handleFilterChange('difficulty', value)}
              >
                {difficulties.map(diff => (
                  <Option key={diff.value} value={diff.value}>{diff.label}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Loại"
                allowClear
                size="large"
                style={{ width: '100%' }}
                value={filters.enrollmentType}
                onChange={(value) => handleFilterChange('enrollmentType', value)}
              >
                <Option value="free">Miễn phí</Option>
                <Option value="paid">Trả phí</Option>
                <Option value="premium">Premium</Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Courses Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : courses.length === 0 ? (
          <>
            {!hasActiveFilters && (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="Hiện chưa có khóa học public được xuất bản từ backend."
                description="Đây là dữ liệu thật từ API, không phải mock. Khi admin/teacher publish khóa học, danh sách sẽ hiển thị tại đây."
              />
            )}
            <Empty
              description={hasActiveFilters ? "Không có khóa học phù hợp bộ lọc hiện tại" : "Chưa có khóa học nào"}
              style={{ padding: '60px 0' }}
            >
              {hasActiveFilters && (
                <Button onClick={resetFilters}>Xóa bộ lọc</Button>
              )}
            </Empty>
          </>
        ) : (
          <>
            <Row gutter={[24, 24]}>
              {courses.map(course => (
                <Col xs={24} sm={12} md={8} lg={6} key={course._id || course.id}>
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
                        onClick={() => navigate(`/courses/${course._id || course.id}`)}
                      >
                        {!course.thumbnail && <BookOutlined />}
                      </div>
                    }
                    actions={[
                      <Button
                        type="primary"
                        block
                        onClick={() => navigate(`/courses/${course._id || course.id}`)}
                      >
                        Xem chi tiết
                      </Button>,
                    ]}
                  >
                    <div onClick={() => navigate(`/courses/${course._id || course.id}`)} style={{ cursor: 'pointer' }}>
                      <div style={{ marginBottom: 12 }}>
                        {getEnrollmentTypeTag(course.enrollmentType)}
                        {course.level && <Tag>{course.level}</Tag>}
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, minHeight: 48 }}>
                        {course.title}
                      </h3>
                      <p
                        style={{
                          fontSize: 14,
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
                        <div>
                          <Rate disabled defaultValue={course.averageRating || 0} allowHalf style={{ fontSize: 14 }} />
                          <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>
                            ({course.totalRatings || 0})
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999' }}>
                        <span>
                          <UserOutlined /> {course.enrolledStudents || 0} học viên
                        </span>
                        {course.totalLessons > 0 && (
                          <span>
                            <BookOutlined /> {course.totalLessons} bài học
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: 12, textAlign: 'right' }}>
                        <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
                          {formatPrice(course.price, course.currency)}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div style={{ textAlign: 'center', marginTop: 40 }}>
                <Pagination
                  current={pagination.page}
                  total={pagination.total}
                  pageSize={pagination.limit}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} khóa học`}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Courses;
