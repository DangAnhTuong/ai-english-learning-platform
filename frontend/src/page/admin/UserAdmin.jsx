import React, { useState, useEffect } from 'react';
import {
  Table, Tag, Button, Space, Card, Avatar, Modal, Descriptions,
  message, Popconfirm, Form, Input, Select, Spin, Row, Col,
  Typography, Tooltip, Tabs, Badge, Statistic, Alert
} from 'antd';
import {
  UserOutlined, EyeOutlined, CheckOutlined, StopOutlined,
  KeyOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined,
  SearchOutlined, TeamOutlined, SafetyOutlined, BookOutlined,EditOutlined
} from '@ant-design/icons';
import { adminService } from '../../services/adminService';
import TeacherProfileModal from '../../components/TeacherProfileModal';
import StudentProfileModal from '../../components/StudentProfileModal';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;

const UserAdmin = () => {
  // States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: undefined,
    roles: undefined,
    search: undefined,
  });

  // Modal states
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTeacherProfileOpen, setIsTeacherProfileOpen] = useState(false);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [formPass] = Form.useForm();
  const [formUser] = Form.useForm();

  // Pending teachers
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    teachers: 0,
    pending: 0
  });

  // Role mapping
  const roleMap = {
    student: 'Học viên',
    teacher: 'Giáo viên',
    admin: 'Quản trị viên'
  };

  const statusMap = {
    active: 'Hoạt động',
    pending: 'Chờ duyệt',
    inactive: 'Vô hiệu hóa',
    banned: 'Đã khóa'
  };

  // Load users from API
  useEffect(() => {
    loadUsers();
  }, [pagination.current, pagination.pageSize, filters]);

  useEffect(() => {
    loadPendingTeachers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers(filters, {
        page: pagination.current,
        limit: pagination.pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (response.success && response.data) {
        setUsers(response.data.users || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
        }));

        // Update stats
        setStats(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      console.error('Load users error:', error);
      message.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingTeachers = async () => {
    try {
      setLoadingPending(true);
      const response = await adminService.getPendingTeachers();
      if (response.success) {
        setPendingTeachers(response.data || []);
        setStats(prev => ({ ...prev, pending: response.data?.length || 0 }));
      }
    } catch (error) {
      console.error('Load pending teachers error:', error);
    } finally {
      setLoadingPending(false);
    }
  };

  // Handlers
  const handleDelete = async (userId) => {
    try {
      await adminService.deleteUser(userId);
      message.success('Đã xóa người dùng thành công');
      await loadUsers();
    } catch (error) {
      console.error('Delete user error:', error);
      message.error(error.response?.data?.error || 'Không thể xóa người dùng');
    }
  };

  const handleToggleStatus = async (record) => {
    try {
      if (record.status === 'banned') {
        await adminService.unbanUser(record._id || record.id);
        message.success('Đã mở khóa tài khoản');
      } else {
        await adminService.banUser(record._id || record.id);
        message.success('Đã khóa tài khoản');
      }
      await loadUsers();
    } catch (error) {
      console.error('Toggle status error:', error);
      message.error(error.response?.data?.error || 'Không thể thay đổi trạng thái');
    }
  };

  const handleChangePassword = async (values) => {
    try {
      await adminService.updateUser(selectedUser._id || selectedUser.id, {
        password: values.newPassword
      });
      message.success(`Đã cập nhật mật khẩu cho ${selectedUser.name}`);
      setIsPassOpen(false);
      formPass.resetFields();
    } catch (error) {
      console.error('Change password error:', error);
      message.error(error.response?.data?.error || 'Không thể cập nhật mật khẩu');
    }
  };

  const handleSaveUser = async (values) => {
    try {
      // 1. LẤY VAI TRÒ TỪ FORM (Nếu form bị rỗng thì mặc định là student)
      const selectedRole = values.role || 'student';

      // 2. GÓI DỮ LIỆU ĐỂ GỬI (Bắt buộc phải có role và roles)
      const userData = {
        name: values.name,
        email: values.email,
        status: values.status || 'active',
        roles: [selectedRole], 
        role: selectedRole
      };
      
      // Chỉ gửi phone nếu có giá trị (tránh lỗi validation rỗng của Mongoose)
      if (values.phone && values.phone.trim() !== '') {
        userData.phone = values.phone.trim();
      }

      if (selectedUser) {
        // Nếu là Cập nhật user cũ
        await adminService.updateUser(selectedUser._id || selectedUser.id, userData);
        message.success('Cập nhật thông tin thành công');
      } else {
        // Nếu là Thêm user mới
        if (values.password) {
          userData.password = values.password;
        }
        await adminService.createUser(userData);
        message.success('Thêm người dùng mới thành công');
      }

      setIsEditModalOpen(false);
      formUser.resetFields();
      setSelectedUser(null);
      await loadUsers();

    } catch (error) {
      console.error('Save user error:', error);
      message.error(error.response?.data?.error || 'Không thể lưu thông tin người dùng');
    }
  };
  const handleApproveTeacher = async (teacherId) => {
    try {
      await adminService.approveTeacher(teacherId);
      message.success('Đã duyệt giáo viên thành công');
      loadPendingTeachers();
      loadUsers();
    } catch (error) {
      message.error('Không thể duyệt giáo viên');
    }
  };

  const handleRejectTeacher = async (teacherId) => {
    try {
      await adminService.rejectTeacher(teacherId, 'Không đủ điều kiện');
      message.success('Đã từ chối giáo viên');
      loadPendingTeachers();
      loadUsers();
    } catch (error) {
      message.error('Không thể từ chối giáo viên');
    }
  };

  const handleViewProfile = (record) => {
    setSelectedUser(record);
    if (record.roles?.includes('teacher')) {
      setIsTeacherProfileOpen(true);
    } else {
      setIsStudentProfileOpen(true);
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  // Table columns
  const columns = [
    {
      title: 'Họ tên & Email',
      key: 'name',
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar
            style={{ backgroundColor: record.roles?.includes('teacher') ? '#1890ff' : record.roles?.includes('admin') ? '#f5222d' : '#87d068' }}
            icon={<UserOutlined />}
            src={record.avatar}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.email}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Vai trò',
      dataIndex: 'roles',
      width: 150,
      render: (roles) => (
        <Space direction="vertical" size={0}>
          {roles && roles.map(role => (
            <Tag key={role} color={role === 'teacher' ? 'blue' : role === 'admin' ? 'red' : 'green'}>
              {roleMap[role] || role}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 120,
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : status === 'banned' ? 'red' : status === 'pending' ? 'orange' : 'default'}>
          {statusMap[status] || status}
        </Tag>
      )
    },
    {
      title: 'Email xác thực',
      dataIndex: 'isEmailVerified',
      width: 120,
      align: 'center',
      render: (verified) => verified ? <Tag color="green">Đã xác thực</Tag> : <Tag color="red">Chưa xác thực</Tag>
    },
    {
      title: 'Đăng nhập gần nhất',
      dataIndex: 'lastLoginAt',
      width: 150,
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : <Text type="secondary">Chưa đăng nhập</Text>
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem hồ sơ chi tiết">
            <Button icon={<EyeOutlined />} size="small" onClick={() => handleViewProfile(record)} />
          </Tooltip>
          <Tooltip title="Chỉnh sửa & Cấp quyền">
            <Button 
              icon={<EditOutlined />} 
              size="small" 
              type="primary" ghost
              onClick={() => {
                setSelectedUser(record);
                setIsEditModalOpen(true);
                formUser.resetFields();
                formUser.setFieldsValue({
                  name: record.name,
                  email: record.email,
                  phone: record.phone,
                  // Lấy vai trò hiện tại của user (nếu có) để hiển thị lên Form, mặc định là học viên
                  role: record.roles && record.roles.length > 0 ? record.roles[0] : 'student',
                  status: record.status || 'active'
                });
              }} 
            />
          </Tooltip>
          <Tooltip title="Đổi mật khẩu">
            <Button icon={<KeyOutlined />} size="small" onClick={() => { setSelectedUser(record); setIsPassOpen(true); }} />
          </Tooltip>
          <Tooltip title={record.status === 'banned' ? 'Mở khóa' : 'Khóa tài khoản'}>
            <Popconfirm
              title={record.status === 'banned' ? 'Mở khóa tài khoản này?' : 'Khóa tài khoản này?'}
              okText="Đồng ý"
              cancelText="Hủy"
              onConfirm={() => handleToggleStatus(record)}
            >
              <Button
                type={record.status === 'banned' ? 'primary' : 'default'}
                danger={record.status !== 'banned'}
                size="small"
                icon={record.status === 'banned' ? <CheckOutlined /> : <StopOutlined />}
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xóa người dùng này? Hành động này không thể hoàn tác!"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => handleDelete(record._id || record.id)}
            >
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Pending teachers columns
  const pendingColumns = [
    {
      title: 'Họ tên',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={record.avatar} />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.email}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: phone => phone || <Text type="secondary">Chưa cập nhật</Text>
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: date => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleApproveTeacher(record._id)}
          >
            Duyệt
          </Button>
          <Popconfirm
            title="Từ chối giáo viên này?"
            onConfirm={() => handleRejectTeacher(record._id)}
            okText="Từ chối"
            cancelText="Hủy"
          >
            <Button danger size="small" icon={<StopOutlined />}>
              Từ chối
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          <TeamOutlined /> Tất cả người dùng
        </span>
      ),
      children: (
        <>
          {/* Filters */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Input
                placeholder="Tìm kiếm (tên, email, SĐT)"
                prefix={<SearchOutlined />}
                allowClear
                onChange={(e) => {
                  const value = e.target.value.trim() || undefined;
                  setFilters(prev => ({ ...prev, search: value }));
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Trạng thái"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => {
                  setFilters(prev => ({ ...prev, status: value }));
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
              >
                <Option value="active">Hoạt động</Option>
                <Option value="inactive">Vô hiệu hóa</Option>
                <Option value="banned">Đã khóa</Option>
                <Option value="pending">Chờ duyệt</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="Vai trò"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => {
                  setFilters(prev => ({ ...prev, roles: value ? [value] : undefined }));
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
              >
                <Option value="student">Học viên</Option>
                <Option value="teacher">Giáo viên</Option>
                <Option value="admin">Quản trị viên</Option>
              </Select>
            </Col>
          </Row>

          <Spin spinning={loading}>
            <Table
              dataSource={users}
              columns={columns}
              rowKey={(record) => record._id || record.id}
              pagination={pagination}
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
            />
          </Spin>
        </>
      )
    },
    {
      key: 'pending',
      label: (
        <Badge count={pendingTeachers.length} offset={[10, 0]}>
          <span>
            <SafetyOutlined /> Giáo viên chờ duyệt
          </span>
        </Badge>
      ),
      children: (
        <>
          {pendingTeachers.length > 0 ? (
            <>
              <Alert
                message={`Có ${pendingTeachers.length} giáo viên đang chờ duyệt`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Spin spinning={loadingPending}>
                <Table
                  dataSource={pendingTeachers}
                  columns={pendingColumns}
                  rowKey="_id"
                  pagination={{ pageSize: 10 }}
                />
              </Spin>
            </>
          ) : (
            <Alert
              message="Không có giáo viên nào đang chờ duyệt"
              type="success"
              showIcon
            />
          )}
        </>
      )
    }
  ];

  return (
    <Card
      title={
        <Space>
          <TeamOutlined />
          <span>Quản trị Người dùng</span>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { loadUsers(); loadPendingTeachers(); }}>
            Tải lại
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedUser(null);
              setIsEditModalOpen(true);
              formUser.resetFields();
              formUser.setFieldsValue({
                status: 'active',
                role: 'student'
              });
            }}
          >
            Thêm người dùng
          </Button>
        </Space>
      }
      bordered={false}
    >
      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Tổng người dùng" value={pagination.total} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Học viên"
              value={users.filter(u => u.roles?.includes('student')).length}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Giáo viên"
              value={users.filter(u => u.roles?.includes('teacher')).length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Chờ duyệt"
              value={pendingTeachers.length}
              prefix={<SafetyOutlined />}
              valueStyle={{ color: pendingTeachers.length > 0 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs items={tabItems} />

      {/* Modal thêm/sửa user */}
      <Modal
        title={selectedUser ? "Cập nhật thông tin" : "Thêm người dùng mới"}
        open={isEditModalOpen}
        onOk={() => {
          formUser.validateFields().then(values => {
            handleSaveUser(values);
          }).catch(info => {
            console.log('Validate Failed:', info);
            message.error('Vui lòng kiểm tra lại các trường dữ liệu!');
          });
        }}
        onCancel={() => {
          setIsEditModalOpen(false);
          formUser.resetFields();
          setSelectedUser(null);
        }}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={loading}
        width={600}
        centered
      >
        <Form form={formUser} layout="vertical" name="userForm">
          {selectedUser && (
            <div style={{ marginBottom: 16, fontWeight: 'bold', color: '#1890ff' }}>
              Đang chỉnh sửa: {selectedUser.name}
            </div>
          )}

          <Form.Item
            name="name"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input placeholder="Nhập họ tên" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input placeholder="Nhập email" disabled={!!selectedUser} />
          </Form.Item>

          {!selectedUser && (
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên' }
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>
          )}

          <Form.Item name="phone" label="Số điện thoại">
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
  name="role"
  label="Vai trò"
  rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
>
  <Select placeholder="Chọn vai trò"> {/* Đã xóa bỏ disabled */}
    <Option value="student">Học viên</Option>
    <Option value="teacher">Giáo viên</Option>
    <Option value="admin">Quản trị viên</Option>
  </Select>
</Form.Item>

          <Form.Item name="status" label="Trạng thái">
            <Select placeholder="Chọn trạng thái">
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Vô hiệu hóa</Option>
              <Option value="pending">Chờ duyệt</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal đổi mật khẩu */}
      <Modal
        title={`Đặt lại mật khẩu: ${selectedUser?.name}`}
        open={isPassOpen}
        onCancel={() => {
          setIsPassOpen(false);
          formPass.resetFields();
        }}
        onOk={() => formPass.submit()}
        okText="Cập nhật"
        cancelText="Hủy"
        centered
      >
        <Form form={formPass} onFinish={handleChangePassword} layout="vertical">
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên' }
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Teacher Profile Modal */}
      <TeacherProfileModal
        open={isTeacherProfileOpen}
        onClose={() => {
          setIsTeacherProfileOpen(false);
          setSelectedUser(null);
        }}
        teacherId={selectedUser?._id || selectedUser?.id}
      />

      {/* Student Profile Modal */}
      <StudentProfileModal
        open={isStudentProfileOpen}
        onClose={() => {
          setIsStudentProfileOpen(false);
          setSelectedUser(null);
        }}
        studentId={selectedUser?._id || selectedUser?.id}
        onUpdate={loadUsers}
      />
    </Card>
  );
};

export default UserAdmin;
