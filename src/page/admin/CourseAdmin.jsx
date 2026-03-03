import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Modal, Form, Input, InputNumber, Select, Switch,
  message, Space, Popconfirm, Spin, Typography, Row, Col
} from 'antd';
import {
  BookOutlined, EditOutlined, DeleteOutlined, PlusOutlined,
  ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined
} from '@ant-design/icons';
import { adminService } from '../../services/adminService';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const FALLBACK_CATEGORIES = [
  { value: 'grammar', label: 'Ngữ pháp' },
  { value: 'vocabulary', label: 'Từ vựng' },
  { value: 'listening', label: 'Nghe' },
  { value: 'speaking', label: 'Nói' },
  { value: 'reading', label: 'Đọc' },
  { value: 'writing', label: 'Viết' },
  { value: 'pronunciation', label: 'Phát âm' },
  { value: 'business', label: 'Tiếng Anh công sở' },
  { value: 'ielts', label: 'IELTS' },
  { value: 'toefl', label: 'TOEFL' },
  { value: 'conversation', label: 'Hội thoại' },
];

const FALLBACK_LEVELS = [
  { value: 'A1', label: 'A1 - Sơ cấp' },
  { value: 'A2', label: 'A2 - Sơ trung cấp' },
  { value: 'B1', label: 'B1 - Trung cấp' },
  { value: 'B2', label: 'B2 - Trung cao cấp' },
  { value: 'C1', label: 'C1 - Cao cấp' },
  { value: 'C2', label: 'C2 - Thành thạo' },
];

const FALLBACK_DIFFICULTIES = [
  { value: 'beginner', label: 'Cơ bản' },
  { value: 'elementary', label: 'Sơ cấp' },
  { value: 'intermediate', label: 'Trung cấp' },
  { value: 'upper_intermediate', label: 'Trung cao cấp' },
  { value: 'advanced', label: 'Nâng cao' },
  { value: 'proficient', label: 'Thành thạo' },
];

const CourseAdmin = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [levels, setLevels] = useState(FALLBACK_LEVELS);
  const [difficulties, setDifficulties] = useState(FALLBACK_DIFFICULTIES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadMetadata();
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toTitleCase = (value) => {
    if (!value) return '';
    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const loadMetadata = async () => {
    try {
      setMetaLoading(true);

      const [categoriesRes, levelsRes] = await Promise.all([
        adminService.getCategories(),
        adminService.getLevels({ isActive: true }, { page: 1, limit: 100, sortBy: 'order', sortOrder: 'asc' }),
      ]);

      const categoryRows = categoriesRes?.data?.categories || [];
      if (categoriesRes?.success && categoryRows.length > 0) {
        setCategories(
          categoryRows.map(category => ({
            value: category._id,
            label: toTitleCase(category._id),
          }))
        );
      }

      if (levelsRes?.success && Array.isArray(levelsRes.data) && levelsRes.data.length > 0) {
        setLevels(
          levelsRes.data.map(level => ({
            value: level.code,
            label: `${level.code} - ${level.name}`,
          }))
        );
      }
    } catch (error) {
      console.error('Load course metadata error:', error);
    } finally {
      setMetaLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await adminService.getMyCreatedCourses();
      
      if (response.success && response.data) {
        const loadedCourses = response.data.courses || [];
        setCourses(loadedCourses);

        if (categories.length === 0) {
          const uniqueCategories = Array.from(new Set(loadedCourses.map(course => course?.category).filter(Boolean)));
          if (uniqueCategories.length > 0) {
            setCategories(uniqueCategories.map(cat => ({ value: cat, label: toTitleCase(cat) })));
          }
        }

        if (levels.length === 0) {
          const uniqueLevels = Array.from(new Set(loadedCourses.map(course => course?.level).filter(Boolean)));
          if (uniqueLevels.length > 0) {
            setLevels(uniqueLevels.map(level => ({ value: level, label: level })));
          }
        }

        const uniqueDifficulties = Array.from(
          new Set(loadedCourses.map(course => course?.difficulty).filter(Boolean))
        );
        if (uniqueDifficulties.length > 0) {
          setDifficulties(
            uniqueDifficulties.map(diff => ({
              value: diff,
              label: FALLBACK_DIFFICULTIES.find(item => item.value === diff)?.label || toTitleCase(diff),
            }))
          );
        }
      }
    } catch (error) {
      console.error('Load courses error:', error);
      message.error('Không thể tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    try {
      if (editingCourse) {
        await adminService.updateCourse(editingCourse._id || editingCourse.id, values);
        message.success('Cập nhật khóa học thành công');
      } else {
        await adminService.createCourse(values);
        message.success('Tạo khóa học thành công');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingCourse(null);
      await loadCourses();
    } catch (error) {
      console.error('Save course error:', error);
      message.error(error.response?.data?.error || 'Không thể lưu khóa học');
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminService.deleteCourse(id);
      message.success('Đã xóa khóa học');
      await loadCourses();
    } catch (error) {
      console.error('Delete course error:', error);
      message.error('Không thể xóa khóa học');
    }
  };

  const handlePublish = async (id, publish = true) => {
    try {
      if (publish) {
        await adminService.publishCourse(id);
        message.success('Đã xuất bản khóa học');
      } else {
        await adminService.unpublishCourse(id);
        message.success('Đã hủy xuất bản khóa học');
      }
      await loadCourses();
    } catch (error) {
      console.error('Publish course error:', error);
      message.error(error.response?.data?.error || 'Không thể thay đổi trạng thái khóa học');
    }
  };

  const formatPrice = (price, currency = 'VND') => {
    if (!price || price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN').format(price) + ' ' + currency;
  };

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      width: 250,
      render: (text, record) => (
        <div>
          <Text strong style={{ color: '#1890ff' }}>{text}</Text>
          {record.shortDescription && (
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {record.shortDescription}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      width: 120,
      render: (cat) => {
        const category = categories.find(c => c.value === cat);
        return <Tag color="blue">{category?.label || cat}</Tag>;
      },
    },
    {
      title: 'Trình độ',
      dataIndex: 'level',
      width: 100,
      render: (level) => <Tag>{level}</Tag>,
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      width: 120,
      render: (price, record) => (
        <Text strong>{formatPrice(price, record.currency)}</Text>
      ),
    },
    {
      title: 'Học viên',
      dataIndex: 'enrolledStudents',
      width: 80,
      align: 'center',
      render: (count) => count || 0,
    },
    {
      title: 'Hiển thị',
      dataIndex: 'isPublic',
      width: 100,
      align: 'center',
      render: (isPublic) => <Tag color={isPublic ? 'green' : 'default'}>{isPublic ? 'Public' : 'Private'}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 120,
      render: (status) => {
        const colors = {
          published: 'green',
          draft: 'orange',
          archived: 'default',
          under_review: 'blue',
        };
        const labels = {
          published: 'Đã xuất bản',
          draft: 'Bản nháp',
          archived: 'Đã lưu trữ',
          under_review: 'Đang duyệt',
        };
        return <Tag color={colors[status]}>{labels[status] || status}</Tag>;
      },
    },
    {
      title: 'Hành động',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/courses/${record._id || record.id}`)}
          >
            Xem
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingCourse(record);
              form.setFieldsValue({
                title: record.title,
                description: record.description,
                shortDescription: record.shortDescription,
                category: record.category,
                level: record.level,
                difficulty: record.difficulty,
                enrollmentType: record.enrollmentType,
                price: record.price,
                currency: record.currency || 'VND',
                isPublic: record.isPublic,
              });
              setIsModalOpen(true);
            }}
          />
          {record.status === 'published' ? (
            <Popconfirm
              title="Hủy xuất bản khóa học này?"
              onConfirm={() => handlePublish(record._id || record.id, false)}
            >
              <Button icon={<CloseCircleOutlined />} size="small" danger>
                Ẩn
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Xuất bản khóa học này?"
              onConfirm={() => handlePublish(record._id || record.id, true)}
            >
              <Button icon={<CheckCircleOutlined />} size="small" type="primary">
                Xuất bản
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Xóa khóa học này? Hành động này không thể hoàn tác!"
            onConfirm={() => handleDelete(record._id || record.id)}
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <BookOutlined />
          <span>Quản lý Khóa học</span>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadCourses}>
            Tải lại
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingCourse(null);
              form.resetFields();
              form.setFieldsValue({
                enrollmentType: 'free',
                currency: 'VND',
                isPublic: true,
              });
              setIsModalOpen(true);
            }}
          >
            Tạo khóa học mới
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading || metaLoading}>
        <Table
          dataSource={courses}
          columns={columns}
          rowKey={(record) => record._id || record.id}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Spin>

      {/* Modal Create/Edit Course */}
      <Modal
        title={editingCourse ? 'Sửa khóa học' : 'Tạo khóa học mới'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingCourse(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={800}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="title"
            label="Tiêu đề khóa học"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="VD: Tiếng Anh Giao Tiếp Cơ Bản" />
          </Form.Item>

          <Form.Item
            name="shortDescription"
            label="Mô tả ngắn"
            rules={[{ max: 500, message: 'Mô tả ngắn không được vượt quá 500 ký tự' }]}
          >
            <TextArea rows={2} placeholder="Mô tả ngắn gọn về khóa học" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả chi tiết"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
          >
            <TextArea rows={4} placeholder="Mô tả chi tiết về khóa học" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="category"
                label="Danh mục"
                rules={[{ required: true }]}
              >
                <Select placeholder="Chọn danh mục">
                  {categories.map((cat) => (
                    <Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="level"
                label="Trình độ"
                rules={[{ required: true }]}
              >
                <Select placeholder="Chọn trình độ">
                  {levels.map((level) => (
                    <Option key={level.value} value={level.value}>
                      {level.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="difficulty"
                label="Độ khó"
                rules={[{ required: true }]}
              >
                <Select placeholder="Chọn độ khó">
                  {difficulties.map((diff) => (
                    <Option key={diff.value} value={diff.value}>
                      {diff.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="enrollmentType"
                label="Loại đăng ký"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="free">Miễn phí</Option>
                  <Option value="paid">Trả phí</Option>
                  <Option value="premium">Premium</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.enrollmentType !== currentValues.enrollmentType
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue('enrollmentType') !== 'free' ? (
                    <Form.Item name="price" label="Giá (VNĐ)" rules={[{ required: true }]}>
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="isPublic" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Công khai" unCheckedChildren="Riêng tư" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CourseAdmin;
