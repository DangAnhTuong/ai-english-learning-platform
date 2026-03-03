import React, { useState, useEffect } from 'react';
import {
    Modal, Descriptions, Tag, Spin, Card, Row, Col, Statistic,
    Table, Progress, Empty, Avatar, Tabs, Timeline, Badge, Space, 
    Typography, Form, Select, Button, DatePicker, message, Divider
} from 'antd';
import {
    UserOutlined, BookOutlined, CrownOutlined, HistoryOutlined,
    TrophyOutlined, ClockCircleOutlined, CheckCircleOutlined,
    RiseOutlined, DollarOutlined, CalendarOutlined
} from '@ant-design/icons';
import { adminService } from '../services/adminService';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Option } = Select;

const StudentProfileModal = ({ open, onClose, studentId, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState(null);
    const [editingLevel, setEditingLevel] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState(false);
    const [formLevel] = Form.useForm();
    const [formSub] = Form.useForm();

    useEffect(() => {
        if (open && studentId) {
            loadProfile();
        }
    }, [open, studentId]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await adminService.getStudentProfile(studentId);
            if (response.success) {
                setProfile(response.data);
            }
        } catch (error) {
            console.error('Load student profile error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLevel = async (values) => {
        try {
            await adminService.updateStudentLevel(studentId, values.level);
            message.success('Đã cập nhật level thành công');
            setEditingLevel(false);
            loadProfile();
            if (onUpdate) onUpdate();
        } catch (error) {
            message.error('Không thể cập nhật level');
        }
    };

    const handleUpdateSubscription = async (values) => {
        try {
            const data = {
                plan: values.plan,
                startDate: values.startDate?.toDate(),
                endDate: values.endDate?.toDate(),
                status: values.status
            };
            await adminService.updateStudentSubscription(studentId, data);
            message.success('Đã cập nhật gói học thành công');
            setEditingSubscription(false);
            loadProfile();
            if (onUpdate) onUpdate();
        } catch (error) {
            message.error('Không thể cập nhật gói học');
        }
    };

    const statusColors = {
        active: 'success',
        pending: 'warning',
        inactive: 'default',
        banned: 'error'
    };

    const statusLabels = {
        active: 'Hoạt động',
        pending: 'Chờ duyệt',
        inactive: 'Vô hiệu hóa',
        banned: 'Đã khóa'
    };

    const levelLabels = {
        beginner: 'Sơ cấp (Beginner)',
        elementary: 'Căn bản (Elementary)',
        intermediate: 'Trung cấp (Intermediate)',
        upper_intermediate: 'Trung cao cấp (Upper Intermediate)',
        advanced: 'Cao cấp (Advanced)',
        proficient: 'Thành thạo (Proficient)'
    };

    const planLabels = {
        free: 'Miễn phí',
        basic: 'Cơ bản',
        premium: 'Premium',
        vip: 'VIP'
    };

    const planColors = {
        free: 'default',
        basic: 'blue',
        premium: 'gold',
        vip: 'purple'
    };

    const subscriptionColumns = [
        {
            title: 'Gói',
            dataIndex: 'plan',
            key: 'plan',
            render: plan => <Tag color={planColors[plan]}>{planLabels[plan]}</Tag>
        },
        {
            title: 'Bắt đầu',
            dataIndex: 'startDate',
            key: 'startDate',
            render: date => dayjs(date).format('DD/MM/YYYY')
        },
        {
            title: 'Kết thúc',
            dataIndex: 'endDate',
            key: 'endDate',
            render: date => date ? dayjs(date).format('DD/MM/YYYY') : 'Không giới hạn'
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: status => (
                <Tag color={status === 'active' ? 'success' : status === 'expired' ? 'red' : 'default'}>
                    {status === 'active' ? 'Đang hoạt động' : 
                     status === 'expired' ? 'Hết hạn' : 
                     status === 'cancelled' ? 'Đã hủy' : status}
                </Tag>
            )
        }
    ];

    const orderColumns = [
        {
            title: 'Mã đơn',
            dataIndex: 'orderNumber',
            key: 'orderNumber',
            render: text => <Text copyable={{ text }}>{text?.slice(-8)}</Text>
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: amount => new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
            }).format(amount || 0)
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: status => (
                <Tag color={status === 'completed' ? 'success' : status === 'pending' ? 'warning' : 'error'}>
                    {status === 'completed' ? 'Thành công' : 
                     status === 'pending' ? 'Chờ xử lý' : 'Thất bại'}
                </Tag>
            )
        },
        {
            title: 'Ngày',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: date => dayjs(date).format('DD/MM/YYYY HH:mm')
        }
    ];

    const tabItems = [
        {
            key: 'info',
            label: (
                <span>
                    <UserOutlined /> Thông tin cá nhân
                </span>
            ),
            children: profile && (
                <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="ID học viên" span={2}>
                        <Text copyable>{profile.student._id}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Họ tên">{profile.student.name}</Descriptions.Item>
                    <Descriptions.Item label="Email">{profile.student.email}</Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">{profile.student.phone || 'Chưa cập nhật'}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        <Tag color={statusColors[profile.student.status]}>
                            {statusLabels[profile.student.status]}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Email xác thực">
                        {profile.student.isEmailVerified ? 
                            <Tag color="success">Đã xác thực</Tag> : 
                            <Tag color="warning">Chưa xác thực</Tag>
                        }
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày đăng ký">
                        {dayjs(profile.student.createdAt).format('DD/MM/YYYY HH:mm')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Đăng nhập gần nhất">
                        {profile.student.lastLoginAt ? 
                            dayjs(profile.student.lastLoginAt).format('DD/MM/YYYY HH:mm') : 
                            'Chưa đăng nhập'
                        }
                    </Descriptions.Item>
                    <Descriptions.Item label="Tổng số lần đăng nhập">
                        {profile.student.totalLogins || 0} lần
                    </Descriptions.Item>
                </Descriptions>
            )
        },
        {
            key: 'learning',
            label: (
                <span>
                    <BookOutlined /> Trình độ & Học tập
                </span>
            ),
            children: profile && (
                <>
                    <Card 
                        title="Trình độ tiếng Anh" 
                        size="small" 
                        extra={
                            !editingLevel && (
                                <Button type="link" onClick={() => {
                                    setEditingLevel(true);
                                    formLevel.setFieldsValue({ 
                                        level: profile.learningProfile?.englishLevel || 'beginner'
                                    });
                                }}>
                                    Cập nhật
                                </Button>
                            )
                        }
                        style={{ marginBottom: 16 }}
                    >
                        {editingLevel ? (
                            <Form form={formLevel} layout="inline" onFinish={handleUpdateLevel}>
                                <Form.Item name="level" rules={[{ required: true }]}>
                                    <Select style={{ width: 250 }}>
                                        {Object.entries(levelLabels).map(([value, label]) => (
                                            <Option key={value} value={value}>{label}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item>
                                    <Space>
                                        <Button type="primary" htmlType="submit" size="small">Lưu</Button>
                                        <Button size="small" onClick={() => setEditingLevel(false)}>Hủy</Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        ) : (
                            <Space direction="vertical">
                                <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                                    {levelLabels[profile.learningProfile?.englishLevel] || 'Chưa xác định'}
                                </Tag>
                                {profile.learningProfile?.targetLevel && (
                                    <Text type="secondary">
                                        Mục tiêu: {levelLabels[profile.learningProfile.targetLevel]}
                                    </Text>
                                )}
                            </Space>
                        )}
                    </Card>

                    {profile.learningProfile?.skillLevels && (
                        <Card title="Kỹ năng" size="small">
                            <Row gutter={[16, 16]}>
                                {Object.entries(profile.learningProfile.skillLevels).map(([skill, value]) => (
                                    <Col span={8} key={skill}>
                                        <div style={{ marginBottom: 4, textTransform: 'capitalize' }}>
                                            {skill === 'listening' ? 'Nghe' :
                                             skill === 'speaking' ? 'Nói' :
                                             skill === 'reading' ? 'Đọc' :
                                             skill === 'writing' ? 'Viết' :
                                             skill === 'vocabulary' ? 'Từ vựng' :
                                             skill === 'grammar' ? 'Ngữ pháp' : skill}
                                        </div>
                                        <Progress 
                                            percent={value || 0} 
                                            size="small"
                                            status={value >= 70 ? 'success' : 'active'}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </Card>
                    )}

                    <Card title="Tiến độ học tập" size="small" style={{ marginTop: 16 }}>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Statistic
                                    title="Tổng thời gian học"
                                    value={profile.progress?.totalTimeSpent || 0}
                                    suffix="phút"
                                    prefix={<ClockCircleOutlined />}
                                />
                            </Col>
                            <Col span={8}>
                                <Statistic
                                    title="Bài đã hoàn thành"
                                    value={profile.progress?.completedItems || 0}
                                    prefix={<CheckCircleOutlined />}
                                    valueStyle={{ color: '#52c41a' }}
                                />
                            </Col>
                            <Col span={8}>
                                <Statistic
                                    title="Điểm trung bình"
                                    value={
                                        profile.progress?.stats?.length > 0
                                            ? Math.round(profile.progress.stats.reduce((acc, s) => acc + (s.avgScore || 0), 0) / profile.progress.stats.length)
                                            : 0
                                    }
                                    suffix="/ 100"
                                    prefix={<TrophyOutlined />}
                                />
                            </Col>
                        </Row>
                    </Card>
                </>
            )
        },
        {
            key: 'subscription',
            label: (
                <span>
                    <CrownOutlined /> Gói học ({profile?.subscriptions?.history?.length || 0})
                </span>
            ),
            children: profile && (
                <>
                    <Card 
                        title="Gói học hiện tại"
                        size="small"
                        extra={
                            !editingSubscription && (
                                <Button type="link" onClick={() => {
                                    setEditingSubscription(true);
                                    const activeSub = profile.subscriptions?.active;
                                    formSub.setFieldsValue({
                                        plan: activeSub?.plan || 'basic',
                                        status: activeSub?.status || 'active',
                                        startDate: activeSub?.startDate ? dayjs(activeSub.startDate) : dayjs(),
                                        endDate: activeSub?.endDate ? dayjs(activeSub.endDate) : null
                                    });
                                }}>
                                    Cập nhật
                                </Button>
                            )
                        }
                        style={{ marginBottom: 16 }}
                    >
                        {editingSubscription ? (
                            <Form form={formSub} layout="vertical" onFinish={handleUpdateSubscription}>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="plan" label="Gói" rules={[{ required: true }]}>
                                            <Select>
                                                <Option value="free">Miễn phí</Option>
                                                <Option value="basic">Cơ bản</Option>
                                                <Option value="premium">Premium</Option>
                                                <Option value="vip">VIP</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
                                            <Select>
                                                <Option value="active">Hoạt động</Option>
                                                <Option value="expired">Hết hạn</Option>
                                                <Option value="cancelled">Đã hủy</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="startDate" label="Ngày bắt đầu">
                                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="endDate" label="Ngày kết thúc">
                                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Form.Item>
                                    <Space>
                                        <Button type="primary" htmlType="submit">Lưu</Button>
                                        <Button onClick={() => setEditingSubscription(false)}>Hủy</Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        ) : (
                            profile.subscriptions?.active ? (
                                <Descriptions column={2} size="small">
                                    <Descriptions.Item label="Gói">
                                        <Tag color={planColors[profile.subscriptions.active.plan]}>
                                            {planLabels[profile.subscriptions.active.plan]}
                                        </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Trạng thái">
                                        <Badge 
                                            status={profile.subscriptions.active.status === 'active' ? 'success' : 'error'} 
                                            text={profile.subscriptions.active.status === 'active' ? 'Đang hoạt động' : 'Hết hạn'}
                                        />
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày bắt đầu">
                                        {dayjs(profile.subscriptions.active.startDate).format('DD/MM/YYYY')}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày kết thúc">
                                        {profile.subscriptions.active.endDate 
                                            ? dayjs(profile.subscriptions.active.endDate).format('DD/MM/YYYY')
                                            : 'Không giới hạn'
                                        }
                                    </Descriptions.Item>
                                </Descriptions>
                            ) : (
                                <Empty description="Chưa có gói học nào" />
                            )
                        )}
                    </Card>

                    <Divider orientation="left">Lịch sử gói học</Divider>
                    <Table
                        dataSource={profile.subscriptions?.history || []}
                        columns={subscriptionColumns}
                        rowKey="_id"
                        pagination={{ pageSize: 5 }}
                        size="small"
                    />
                </>
            )
        },
        {
            key: 'orders',
            label: (
                <span>
                    <DollarOutlined /> Lịch sử mua hàng ({profile?.orders?.length || 0})
                </span>
            ),
            children: profile && (
                <Table
                    dataSource={profile.orders || []}
                    columns={orderColumns}
                    rowKey="_id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                />
            )
        },
        {
            key: 'activity',
            label: (
                <span>
                    <HistoryOutlined /> Hoạt động gần đây
                </span>
            ),
            children: profile && (
                profile.recentActivity?.length > 0 ? (
                    <Timeline
                        items={profile.recentActivity.map((activity, index) => ({
                            key: index,
                            color: activity.status === 'completed' ? 'green' : 
                                   activity.status === 'in_progress' ? 'blue' : 'gray',
                            children: (
                                <div>
                                    <Text strong>
                                        {activity.courseId?.title || 'Khóa học'} - {activity.lessonId?.title || activity.type}
                                    </Text>
                                    <br />
                                    <Text type="secondary">
                                        {activity.status === 'completed' ? 'Hoàn thành' : 
                                         activity.status === 'in_progress' ? 'Đang học' : 'Chưa bắt đầu'}
                                        {activity.score && ` - Điểm: ${activity.score}`}
                                    </Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {dayjs(activity.lastAccessedAt).format('DD/MM/YYYY HH:mm')}
                                    </Text>
                                </div>
                            )
                        }))}
                    />
                ) : (
                    <Empty description="Chưa có hoạt động nào" />
                )
            )
        }
    ];

    return (
        <Modal
            title={
                <Space>
                    <Avatar 
                        size={40} 
                        icon={<UserOutlined />} 
                        src={profile?.student?.avatar}
                        style={{ backgroundColor: '#87d068' }}
                    />
                    <div>
                        <div style={{ fontWeight: 600 }}>{profile?.student?.name || 'Hồ sơ Học viên'}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Học viên</Text>
                    </div>
                </Space>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            width={950}
            centered
            styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
        >
            <Spin spinning={loading}>
                {profile ? (
                    <>
                        {/* Stats Summary */}
                        <Row gutter={16} style={{ marginBottom: 24 }}>
                            <Col span={6}>
                                <Card size="small">
                                    <Statistic
                                        title="Trình độ"
                                        value={levelLabels[profile.learningProfile?.englishLevel]?.split(' ')[0] || 'Chưa xác định'}
                                        prefix={<RiseOutlined />}
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card size="small">
                                    <Statistic
                                        title="Gói học"
                                        value={planLabels[profile.subscriptions?.active?.plan] || 'Chưa có'}
                                        prefix={<CrownOutlined />}
                                        valueStyle={{ 
                                            color: profile.subscriptions?.active?.status === 'active' ? '#52c41a' : '#999' 
                                        }}
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card size="small">
                                    <Statistic
                                        title="Thời gian học"
                                        value={profile.progress?.totalTimeSpent || 0}
                                        suffix="phút"
                                        prefix={<ClockCircleOutlined />}
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card size="small">
                                    <Statistic
                                        title="Đăng nhập"
                                        value={profile.student.totalLogins || 0}
                                        suffix="lần"
                                        prefix={<CalendarOutlined />}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        {/* Tabs */}
                        <Tabs items={tabItems} defaultActiveKey="info" />
                    </>
                ) : (
                    <Empty description="Không có dữ liệu" />
                )}
            </Spin>
        </Modal>
    );
};

export default StudentProfileModal;
