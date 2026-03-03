import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Typography, Spin, Space, Tag, Table, Progress, List, Avatar, Badge, Alert
} from 'antd';
import {
  UserOutlined, BookOutlined, CommentOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  DollarOutlined, RiseOutlined, SoundOutlined, SafetyOutlined,
  TeamOutlined, CrownOutlined, TrophyOutlined
} from '@ant-design/icons';
import { adminService } from '../../services/adminService';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getDashboardStats();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Load dashboard error:', error);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
      // Fallback data
      setDashboardData({
        users: { total: 0, students: 0, teachers: 0, active: 0, pendingTeachers: 0, newThisWeek: 0 },
        content: { totalConversations: 0, conversationsWithAudio: 0, audioPercentage: 0 },
        revenue: { total: 0, orderCount: 0, totalOrders: 0 },
        recentOrders: [],
        dailyStats: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  const { users, content, revenue, recentOrders, dailyStats } = dashboardData || {};

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        <Space>
          <TrophyOutlined style={{ color: '#faad14' }} />
          Tổng quan Hệ thống
        </Space>
      </Title>

      {error && (
        <Alert message={error} type="warning" showIcon style={{ marginBottom: 16 }} />
      )}

      {/* Pending Teachers Alert */}
      {users?.pendingTeachers > 0 && (
        <Alert
          message={
            <span>
              Có <strong>{users.pendingTeachers}</strong> giáo viên đang chờ duyệt
            </span>
          }
          type="warning"
          showIcon
          icon={<SafetyOutlined />}
          action={
            <a onClick={() => navigate('/admin/users')}>Xem ngay</a>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Main Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => navigate('/admin/users')}
            style={{ borderLeft: '4px solid #1890ff' }}
          >
            <Statistic
              title={<span style={{ fontSize: 14 }}>Tổng người dùng</span>}
              value={users?.total || 0}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontSize: 28 }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                <RiseOutlined style={{ color: '#52c41a' }} /> +{users?.newThisWeek || 0} tuần này
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => navigate('/admin/teacher-modules')}
            style={{ borderLeft: '4px solid #52c41a' }}
          >
            <Statistic
              title={<span style={{ fontSize: 14 }}>Tổng hội thoại</span>}
              value={content?.totalConversations || 0}
              prefix={<CommentOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 28 }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                <SoundOutlined /> {content?.conversationsWithAudio || 0} có audio
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => navigate('/admin/orders')}
            style={{ borderLeft: '4px solid #faad14' }}
          >
            <Statistic
              title={<span style={{ fontSize: 14 }}>Tổng doanh thu</span>}
              value={revenue?.total || 0}
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontSize: 28 }}
              formatter={(value) => formatCurrency(value)}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                {revenue?.orderCount || 0} đơn thành công
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderLeft: '4px solid #722ed1' }}>
            <Statistic
              title={<span style={{ fontSize: 14 }}>Audio hoàn thành</span>}
              value={content?.audioPercentage || 0}
              suffix="%"
              prefix={<SoundOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1', fontSize: 28 }}
            />
            <Progress
              percent={content?.audioPercentage || 0}
              showInfo={false}
              strokeColor="#722ed1"
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* User Distribution */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={<Space><UserOutlined /> Phân bố Người dùng</Space>}>
            <Row gutter={16}>
              <Col span={8}>
                <Card
                  size="small"
                  style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}
                  hoverable
                  onClick={() => navigate('/admin/users')}
                >
                  <Statistic
                    title="Học viên"
                    value={users?.students || 0}
                    prefix={<BookOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  size="small"
                  style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}
                  hoverable
                  onClick={() => navigate('/admin/users')}
                >
                  <Statistic
                    title="Giáo viên"
                    value={users?.teachers || 0}
                    prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  size="small"
                  style={{ background: '#fff7e6', borderColor: '#ffd591' }}
                >
                  <Statistic
                    title="Đang hoạt động"
                    value={users?.active || 0}
                    prefix={<CheckCircleOutlined style={{ color: '#faad14' }} />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
            </Row>

            {users?.pendingTeachers > 0 && (
              <div style={{ marginTop: 16 }}>
                <Badge count={users.pendingTeachers} offset={[10, 0]}>
                  <Tag color="warning" style={{ padding: '4px 12px' }}>
                    <SafetyOutlined /> Giáo viên chờ duyệt
                  </Tag>
                </Badge>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<Space><DollarOutlined /> Đơn hàng gần đây</Space>}>
            {recentOrders && recentOrders.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={recentOrders.slice(0, 5)}
                renderItem={(order) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{ backgroundColor: order.status === 'completed' ? '#52c41a' : '#faad14' }}
                          icon={<DollarOutlined />}
                        />
                      }
                      title={
                        <Space>
                          <Text strong>{order.userId?.name || 'Khách hàng'}</Text>
                          <Tag color={order.status === 'completed' || order.status === 'paid' ? 'success' : 'warning'}>
                            {order.status === 'completed' || order.status === 'paid' ? 'Thành công' : 'Chờ xử lý'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space>
                          <Text type="secondary">{formatCurrency(order.amount)}</Text>
                          <Text type="secondary">•</Text>
                          <Text type="secondary">{dayjs(order.createdAt).format('DD/MM/YYYY')}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                Chưa có đơn hàng nào
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title={<Space><RiseOutlined /> Thao tác nhanh</Space>}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              bodyStyle={{ padding: 16 }}
              onClick={() => navigate('/admin/users')}
            >
              <TeamOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              <div style={{ marginTop: 8, fontWeight: 500 }}>Người dùng</div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              bodyStyle={{ padding: 16 }}
              onClick={() => navigate('/admin/teacher-modules')}
            >
              <CommentOutlined style={{ fontSize: 32, color: '#52c41a' }} />
              <div style={{ marginTop: 8, fontWeight: 500 }}>Hội thoại</div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              bodyStyle={{ padding: 16 }}
              onClick={() => navigate('/admin/courses')}
            >
              <BookOutlined style={{ fontSize: 32, color: '#722ed1' }} />
              <div style={{ marginTop: 8, fontWeight: 500 }}>Khóa học</div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              bodyStyle={{ padding: 16 }}
              onClick={() => navigate('/admin/orders')}
            >
              <DollarOutlined style={{ fontSize: 32, color: '#faad14' }} />
              <div style={{ marginTop: 8, fontWeight: 500 }}>Đơn hàng</div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              bodyStyle={{ padding: 16 }}
              onClick={() => navigate('/admin/context')}
            >
              <CrownOutlined style={{ fontSize: 32, color: '#eb2f96' }} />
              <div style={{ marginTop: 8, fontWeight: 500 }}>Gói học</div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              bodyStyle={{ padding: 16 }}
              onClick={() => navigate('/admin/setuppayment')}
            >
              <SafetyOutlined style={{ fontSize: 32, color: '#13c2c2' }} />
              <div style={{ marginTop: 8, fontWeight: 500 }}>Thanh toán</div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default AdminDashboard;
