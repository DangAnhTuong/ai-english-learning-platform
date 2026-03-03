import React, { useState, useEffect } from 'react';
import {
    Modal, Descriptions, Tag, Spin, Card, Row, Col, Statistic,
    Table, Progress, Empty, Avatar, Tabs, Timeline, Badge, Space, Typography
} from 'antd';
import {
    UserOutlined, MessageOutlined, SoundOutlined, CheckCircleOutlined,
    ClockCircleOutlined, BookOutlined, BarChartOutlined
} from '@ant-design/icons';
import { adminService } from '../services/adminService';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const TeacherProfileModal = ({ open, onClose, teacherId }) => {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        if (open && teacherId) {
            loadProfile();
        }
    }, [open, teacherId]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await adminService.getTeacherProfile(teacherId);
            if (response.success) {
                setProfile(response.data);
            }
        } catch (error) {
            console.error('Load teacher profile error:', error);
        } finally {
            setLoading(false);
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
        beginner: 'Sơ cấp',
        intermediate: 'Trung cấp',
        advanced: 'Nâng cao'
    };

    const conversationColumns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <Space>
                    <span style={{ fontWeight: 500 }}>{text}</span>
                    {!record.isActive && <Tag color="red">Ẩn</Tag>}
                </Space>
            )
        },
        {
            title: 'Chủ đề',
            dataIndex: 'topic',
            key: 'topic',
            render: topic => <Tag color="blue">{topic}</Tag>
        },
        {
            title: 'Cấp độ',
            dataIndex: 'level',
            key: 'level',
            render: level => <Tag color="green">{levelLabels[level] || level}</Tag>
        },
        {
            title: 'Số câu',
            dataIndex: 'totalLines',
            key: 'totalLines',
            align: 'center'
        },
        {
            title: 'Audio',
            dataIndex: 'audioGenerationStatus',
            key: 'audio',
            align: 'center',
            render: status => {
                if (status === 'completed') return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
                if (status === 'generating' || status === 'queued') return <ClockCircleOutlined style={{ color: '#faad14' }} />;
                return <span style={{ color: '#ccc' }}>-</span>;
            }
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: date => dayjs(date).format('DD/MM/YYYY')
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
                    <Descriptions.Item label="ID giáo viên" span={2}>
                        <Text copyable>{profile.teacher._id}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Họ tên">{profile.teacher.name}</Descriptions.Item>
                    <Descriptions.Item label="Email">{profile.teacher.email}</Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">{profile.teacher.phone || 'Chưa cập nhật'}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        <Tag color={statusColors[profile.teacher.status]}>
                            {statusLabels[profile.teacher.status]}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Email xác thực">
                        {profile.teacher.isEmailVerified ? 
                            <Tag color="success">Đã xác thực</Tag> : 
                            <Tag color="warning">Chưa xác thực</Tag>
                        }
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày tham gia">
                        {dayjs(profile.teacher.createdAt).format('DD/MM/YYYY HH:mm')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Đăng nhập gần nhất">
                        {profile.teacher.lastLoginAt ? 
                            dayjs(profile.teacher.lastLoginAt).format('DD/MM/YYYY HH:mm') : 
                            'Chưa đăng nhập'
                        }
                    </Descriptions.Item>
                    <Descriptions.Item label="Tổng số lần đăng nhập">
                        {profile.teacher.totalLogins || 0} lần
                    </Descriptions.Item>
                </Descriptions>
            )
        },
        {
            key: 'conversations',
            label: (
                <span>
                    <MessageOutlined /> Hội thoại đã tạo ({profile?.stats?.totalConversations || 0})
                </span>
            ),
            children: profile && (
                <Table
                    dataSource={profile.conversations}
                    columns={conversationColumns}
                    rowKey="_id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                />
            )
        },
        {
            key: 'topics',
            label: (
                <span>
                    <BookOutlined /> Chủ đề ({profile?.topicStats?.length || 0})
                </span>
            ),
            children: profile && (
                <Row gutter={[16, 16]}>
                    {profile.topicStats.length > 0 ? (
                        profile.topicStats.map((topic, index) => (
                            <Col span={8} key={index}>
                                <Card size="small">
                                    <Statistic 
                                        title={topic._id || 'Không xác định'} 
                                        value={topic.count} 
                                        suffix="hội thoại"
                                    />
                                </Card>
                            </Col>
                        ))
                    ) : (
                        <Col span={24}>
                            <Empty description="Chưa có chủ đề nào" />
                        </Col>
                    )}
                </Row>
            )
        },
        {
            key: 'stats',
            label: (
                <span>
                    <BarChartOutlined /> Thống kê
                </span>
            ),
            children: profile && (
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Card title="Thống kê theo cấp độ" size="small">
                            <Row gutter={16}>
                                {profile.levelStats.map((level, index) => (
                                    <Col span={8} key={index}>
                                        <Statistic 
                                            title={levelLabels[level._id] || level._id} 
                                            value={level.count} 
                                            suffix="hội thoại"
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </Card>
                    </Col>
                    <Col span={24}>
                        <Card title="Audio đã tạo" size="small">
                            <Progress 
                                percent={profile.stats.totalLines > 0 
                                    ? Math.round((profile.stats.linesWithAudio / profile.stats.totalLines) * 100)
                                    : 0
                                }
                                format={() => `${profile.stats.linesWithAudio}/${profile.stats.totalLines} câu`}
                                status="active"
                            />
                        </Card>
                    </Col>
                </Row>
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
                        src={profile?.teacher?.avatar}
                        style={{ backgroundColor: '#1890ff' }}
                    />
                    <div>
                        <div style={{ fontWeight: 600 }}>{profile?.teacher?.name || 'Hồ sơ Giáo viên'}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Giáo viên</Text>
                    </div>
                </Space>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            width={900}
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
                                        title="Tổng hội thoại"
                                        value={profile.stats.totalConversations}
                                        prefix={<MessageOutlined />}
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card size="small">
                                    <Statistic
                                        title="Đang hoạt động"
                                        value={profile.stats.activeConversations}
                                        valueStyle={{ color: '#52c41a' }}
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card size="small">
                                    <Statistic
                                        title="Có audio"
                                        value={profile.stats.conversationsWithAudio}
                                        prefix={<SoundOutlined />}
                                        valueStyle={{ color: '#1890ff' }}
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card size="small">
                                    <Statistic
                                        title="Chủ đề"
                                        value={profile.stats.topicCount}
                                        prefix={<BookOutlined />}
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

export default TeacherProfileModal;
