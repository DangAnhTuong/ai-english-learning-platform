import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Avatar, Typography, Tabs, Button, Tag,
  List, Progress, Divider, Timeline, Form, Input, Upload, message,
  Statistic, Space, Badge, Tooltip, Modal, Table, DatePicker,
  Select, Spin, Alert, Empty
} from 'antd';
import {
  UserOutlined, UploadOutlined, SafetyCertificateOutlined,
  HistoryOutlined, WalletOutlined, EditOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CrownOutlined,
  LogoutOutlined, MailOutlined, PhoneOutlined, LockOutlined,
  CalendarOutlined, ArrowLeftOutlined, UnorderedListOutlined,
  TrophyFilled, SketchOutlined, LoadingOutlined, ReloadOutlined,
  GoogleOutlined, BookOutlined, FireOutlined, AimOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// --- IMPORT REDUX ---
import { useSelector, useDispatch } from 'react-redux';
import { updateUser, logout } from '../../redux/authSlice';
import { profileService } from '../../services/profileService';
import { orderService } from '../../services/orderService';
import { subscriptionService } from '../../services/subscriptionService';
import api from '../../services/api';

dayjs.extend(customParseFormat);

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const customStyles = {
  cardShadow: {
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    borderRadius: 12,
    border: 'none',
    overflow: 'hidden'
  },
  primaryColor: '#13c2c2',
};

// --- CẤU HÌNH HẠNG THÀNH VIÊN ---
const MEMBER_TIERS = [
  { key: 'new', name: 'Thành Viên Mới', min: 0, max: 200000, color: '#8c8c8c', icon: <UserOutlined /> },
  { key: 'silver', name: 'Hạng Bạc (Silver)', min: 200000, max: 1000000, color: '#A0A0A0', icon: <TrophyFilled /> },
  { key: 'gold', name: 'Hạng Vàng (Gold)', min: 1000000, max: 3000000, color: '#FAAD14', icon: <CrownOutlined /> },
  { key: 'diamond', name: 'Kim Cương (Diamond)', min: 3000000, max: 9999999999, color: '#1890ff', icon: <SketchOutlined /> }
];

// Fallback levels nếu API chưa load được
const FALLBACK_ENGLISH_LEVELS = [
  { key: 'beginner', name: 'Mới bắt đầu', code: 'A1' },
  { key: 'elementary', name: 'Sơ cấp', code: 'A2' },
  { key: 'intermediate', name: 'Trung cấp', code: 'B1' },
  { key: 'upper_intermediate', name: 'Trung cấp cao', code: 'B2' },
  { key: 'advanced', name: 'Cao cấp', code: 'C1' },
  { key: 'proficient', name: 'Thành thạo', code: 'C2' }
];

const Profile = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [learningForm] = Form.useForm();
  const navigate = useNavigate();

  // HOOKS REDUX
  const dispatch = useDispatch();
  const { user: userRedux } = useSelector((state) => state.auth);

  // STATE Loading
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // STATE Profile Data
  const [profileData, setProfileData] = useState(null);
  const [learningProgress, setLearningProgress] = useState(null);
  const [learningHistory, setLearningHistory] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({ page: 1, limit: 10, total: 0 });

  // STATE MODAL 
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isLearningSettingsOpen, setIsLearningSettingsOpen] = useState(false);

  // STATE Subscription
  const [subscription, setSubscription] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);

  // STATE Password
  const [hasPassword, setHasPassword] = useState(true);

  // STATE Dynamic data từ backend
  const [englishLevels, setEnglishLevels] = useState(FALLBACK_ENGLISH_LEVELS);
  const [pricingPackages, setPricingPackages] = useState([]);

  // --- LOAD METADATA (levels, plans) ---
  const loadMetadata = useCallback(async () => {
    try {
      // Load levels từ API /levels
      const levelsRes = await api.get('/levels', { params: { isActive: true, sortBy: 'order', sortOrder: 'asc' } });
      if (levelsRes.data?.success && levelsRes.data?.data?.length > 0) {
        const mappedLevels = levelsRes.data.data.map(level => ({
          key: level.name?.toLowerCase().replace(/\s+/g, '_'),
          name: level.name,
          code: level.code
        }));
        setEnglishLevels(mappedLevels);
      }
    } catch (error) {
      console.error('Load levels error:', error);
      // Giữ fallback levels
    }

    try {
      // Load pricing plans từ API /subscriptions/plans
      const plansRes = await subscriptionService.getPlans();
      if (plansRes.success && plansRes.data?.length > 0) {
        const mappedPlans = plansRes.data.map(plan => ({
          id: plan.id || plan.order,
          name: plan.name,
          price: new Intl.NumberFormat('vi-VN').format(plan.price) + 'đ',
          value: plan.price,
          duration: plan.duration,
          desc: plan.discount ? `Tiết kiệm ${plan.discount}%.` : 'Thích hợp để trải nghiệm.',
          color: plan.color || '#597ef7',
          isPopular: plan.isPopular || false,
          plan: plan.type
        }));
        setPricingPackages(mappedPlans);
      }
    } catch (error) {
      console.error('Load plans error:', error);
    }
  }, []);

  // --- LOAD DỮ LIỆU BAN ĐẦU ---
  const loadProfileData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, progressRes, passwordRes] = await Promise.all([
        profileService.getFullProfile(),
        profileService.getLearningProgress(),
        profileService.hasPassword()
      ]);

      if (profileRes.success) {
        setProfileData(profileRes.data);
        // Set form values
        form.setFieldsValue({
          name: profileRes.data.user?.name,
          phone: profileRes.data.user?.phone,
          dateOfBirth: profileRes.data.user?.dateOfBirth ? dayjs(profileRes.data.user.dateOfBirth) : null,
          gender: profileRes.data.user?.gender,
          bio: profileRes.data.user?.bio
        });
        // Set learning form values
        learningForm.setFieldsValue({
          englishLevel: profileRes.data.learningProfile?.englishLevel,
          targetLevel: profileRes.data.learningProfile?.targetLevel,
          weeklyStudyGoal: profileRes.data.learningProfile?.weeklyStudyGoal
        });
        // Set subscription
        setSubscription(profileRes.data.subscription);
      }

      if (progressRes.success) {
        setLearningProgress(progressRes.data);
      }

      if (passwordRes.success) {
        setHasPassword(passwordRes.data.hasPassword);
      }

      // Load order history
      const orderRes = await orderService.getOrders({}, { page: 1, limit: 50 });
      if (orderRes.success && orderRes.data) {
        const mappedOrders = orderRes.data.map(order => ({
          pkg: order.package?.name || 'N/A',
          date: dayjs(order.createdAt).format('HH:mm DD/MM/YYYY'),
          amount: `${(order.finalAmount || order.amount || 0).toLocaleString('vi-VN')}đ`,
          price: order.finalAmount || order.amount || 0,
          status: order.status === 'paid' ? 'success' : (order.status === 'pending' ? 'pending' : 'failed')
        }));
        setOrderHistory(mappedOrders);
      }

    } catch (error) {
      console.error('Load profile data error:', error);
      message.error('Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  }, [form, learningForm]);

  const loadLearningHistory = useCallback(async (page = 1) => {
    try {
      const res = await profileService.getLearningHistory({ page, limit: 10 });
      if (res.success) {
        setLearningHistory(res.data.history);
        setHistoryPagination(res.data.pagination);
      }
    } catch (error) {
      console.error('Load learning history error:', error);
    }
  }, []);

  useEffect(() => {
    loadProfileData();
    loadLearningHistory();
    loadMetadata();
  }, [loadProfileData, loadLearningHistory, loadMetadata]);

  // --- TÍNH TOÁN MEMBER TIER ---
  const calculateMemberTier = useCallback((totalSpent) => {
    let currentTier = MEMBER_TIERS[0];
    let nextTier = MEMBER_TIERS[1];

    for (let i = 0; i < MEMBER_TIERS.length; i++) {
      if (totalSpent >= MEMBER_TIERS[i].min) {
        currentTier = MEMBER_TIERS[i];
        nextTier = MEMBER_TIERS[i + 1] || null;
      }
    }

    let tierProgress = 100;
    let toNextTier = 0;
    if (nextTier) {
      const range = nextTier.min - currentTier.min;
      const current = totalSpent - currentTier.min;
      tierProgress = Math.min(Math.round((current / range) * 100), 100);
      toNextTier = nextTier.min - totalSpent;
    }

    return { currentTier, nextTier, tierProgress, toNextTier };
  }, []);

  // --- CÁC CỘT BẢNG ---
  const historyColumns = [
    {
      title: 'Bài học',
      dataIndex: 'title',
      key: 'title',
      render: t => <span style={{ fontWeight: 500 }}>{t}</span>
    },
    {
      title: 'Chủ đề',
      dataIndex: 'topic',
      key: 'topic',
      render: t => <Tag color="blue">{t}</Tag>
    },
    {
      title: 'Ngày học',
      dataIndex: 'lastAccessedAt',
      key: 'lastAccessedAt',
      render: d => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : 'N/A'
    },
    {
      title: 'Điểm số',
      dataIndex: 'score',
      key: 'score',
      align: 'center',
      render: s => s ? <Tag color="success"><b>{s}</b>/10</Tag> : <Tag>Chưa có</Tag>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: s => s === 'completed' ? <Badge status="success" text="Hoàn thành" /> : <Badge status="processing" text="Đang học" />
    }
  ];

  const transactionColumns = [
    { title: 'Gói cước', dataIndex: 'pkg', key: 'pkg', render: t => <Text strong>{t}</Text> },
    { title: 'Thời gian', dataIndex: 'date', key: 'date' },
    { title: 'Số tiền', dataIndex: 'amount', key: 'amount', align: 'right', render: t => <Text type="danger">{t}</Text> },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: s => (
        <Tag color={s === 'success' ? 'green' : (s === 'pending' ? 'orange' : 'red')}>
          {s === 'success' ? 'Thành công' : (s === 'pending' ? 'Chờ duyệt' : 'Thất bại')}
        </Tag>
      )
    }
  ];

  // --- HÀM XỬ LÝ SỰ KIỆN ---

  const handleUpdateInfo = async (values) => {
    setSavingProfile(true);
    try {
      const updateData = {
        name: values.name,
        phone: values.phone,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null,
        gender: values.gender,
        bio: values.bio
      };

      const res = await profileService.updateProfile(updateData);
      if (res.success) {
        // Cập nhật Redux
        dispatch(updateUser({
          name: values.name,
          phone: values.phone
        }));
        message.success('Cập nhật hồ sơ thành công!');
        loadProfileData();
      }
    } catch (error) {
      console.error('Update profile error:', error);
      message.error(error.response?.data?.error || 'Không thể cập nhật hồ sơ');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (values) => {
    setChangingPassword(true);
    try {
      if (hasPassword) {
        await profileService.changePassword(values.currentPassword, values.newPassword);
      } else {
        await profileService.setPassword(values.newPassword);
      }
      message.success('Đổi mật khẩu thành công!');
      passwordForm.resetFields();
      setHasPassword(true);
    } catch (error) {
      console.error('Change password error:', error);
      message.error(error.response?.data?.error || 'Không thể đổi mật khẩu');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUpdateLearning = async (values) => {
    try {
      const res = await profileService.updateLearningProfile(values);
      if (res.success) {
        message.success('Cập nhật hồ sơ học tập thành công!');
        setIsLearningSettingsOpen(false);
        loadProfileData();
      }
    } catch (error) {
      console.error('Update learning profile error:', error);
      message.error(error.response?.data?.error || 'Không thể cập nhật hồ sơ học tập');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleAvatarUpload = async (info) => {
    const file = info.file?.originFileObj || info.file;
    if (!file) return;

    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg' || file.type === 'image/webp';
    if (!isJpgOrPng) {
      message.error('Bạn chỉ có thể tải lên file ảnh (JPG, PNG, WEBP)!');
      return;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Ảnh phải nhỏ hơn 5MB!');
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await profileService.uploadAvatar(file);
      if (res.success) {
        const newAvatarUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${res.data.avatar}`;
        dispatch(updateUser({ avatar: newAvatarUrl }));
        message.success('Đã thay đổi ảnh đại diện!');
        loadProfileData();
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      message.error(error.response?.data?.error || 'Không thể upload ảnh đại diện');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChoosePackage = (pkg) => {
    setIsRenewModalOpen(false);
    navigate('/payment', {
      state: {
        selectedPackage: {
          id: pkg.id,
          name: pkg.name,
          price: pkg.value,
          duration: Math.round(pkg.duration / 30), // days -> months
          plan: pkg.plan || 'basic'
        }
      }
    });
  };

  // --- HELPER FUNCTIONS ---
  const getEnglishLevelDisplay = (level) => {
    const found = englishLevels.find(l => l.key === level);
    return found ? `${found.code} (${found.name})` : 'Chưa xác định';
  };

  const getUserAvatar = () => {
    if (profileData?.user?.avatar) {
      if (profileData.user.avatar.startsWith('http')) {
        return profileData.user.avatar;
      }
      return `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${profileData.user.avatar}`;
    }
    return userRedux?.avatar || null;
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} tip="Đang tải hồ sơ..." />
      </div>
    );
  }

  // --- COMPUTED VALUES ---
  const totalSpent = profileData?.stats?.totalSpent || orderHistory.reduce((sum, o) => sum + (o.price || 0), 0);
  const { currentTier, nextTier, tierProgress, toNextTier } = calculateMemberTier(totalSpent);
  const daysLeft = subscription?.daysLeft || 0;
  const currentLevel = profileData?.learningProfile?.englishLevel || 'beginner';
  const levelProgress = learningProgress?.skillProgress
    ? Math.round(Object.values(learningProgress.skillProgress).reduce((a, b) => a + b, 0) / 7)
    : 0;

  // COMPONENTS CON
  const LearningTab = () => (
    <div>
      <Card
        style={{
          ...customStyles.cardShadow,
          background: 'linear-gradient(135deg, #e6fffb 0%, #f0fcfc 100%)',
          marginBottom: 24
        }}
        bordered={false}
      >
        <Row gutter={24} align="middle">
          <Col span={16}>
            <Space align="center" style={{ marginBottom: 16 }}>
              <Avatar size={64} style={{ backgroundColor: customStyles.primaryColor }} icon={<SafetyCertificateOutlined />} />
              <div>
                <Text type="secondary">Trình độ hiện tại</Text>
                <Title level={3} style={{ margin: 0, color: customStyles.primaryColor }}>
                  {getEnglishLevelDisplay(currentLevel)}
                </Title>
              </div>
            </Space>
            <Progress percent={levelProgress} strokeColor={customStyles.primaryColor} trailColor="#d9f7be" />
            <div style={{ marginTop: 8 }}>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => setIsLearningSettingsOpen(true)}>
                Cập nhật mục tiêu học tập
              </Button>
            </div>
          </Col>
          <Col span={8} style={{ textAlign: 'center', borderLeft: '1px solid #eee' }}>
            <Statistic
              title="Bài đã học"
              value={learningProgress?.lessonsCompleted || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Statistic
              title="Streak hiện tại"
              value={learningProgress?.currentStreak || 0}
              suffix="ngày"
              prefix={<FireOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ fontWeight: 'bold', fontSize: 20 }}
            />
          </Col>
        </Row>
      </Card>

      {/* Skill Progress */}
      {learningProgress?.skillProgress && (
        <Card title={<span><AimOutlined /> Tiến độ kỹ năng</span>} style={{ ...customStyles.cardShadow, marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            {Object.entries(learningProgress.skillProgress).map(([skill, value]) => (
              <Col span={8} key={skill}>
                <div style={{ marginBottom: 4 }}>
                  <Text style={{ textTransform: 'capitalize' }}>{skill}</Text>
                </div>
                <Progress
                  percent={value}
                  size="small"
                  strokeColor={customStyles.primaryColor}
                />
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Title level={5}><HistoryOutlined /> Bài học gần đây</Title>
      {learningHistory.length > 0 ? (
        <>
          <div style={{ padding: '0 12px' }}>
            <Timeline
              items={learningHistory.slice(0, 5).map((item) => ({
                color: item.status === 'completed' ? 'green' : 'blue',
                children: (
                  <Text>
                    {item.title} - <Text type="secondary">{dayjs(item.lastAccessedAt).format('DD/MM/YYYY')}</Text>
                  </Text>
                )
              }))}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <Button type="dashed" onClick={() => setIsHistoryModalOpen(true)}>Xem tất cả lịch sử</Button>
          </div>
        </>
      ) : (
        <Empty description="Chưa có lịch sử học tập" />
      )}
    </div>
  );

  const BillingTab = () => {
    const recentTransactions = orderHistory.slice(0, 10);
    const hasMore = orderHistory.length > 10;

    return (
      <div>
        {/* THẺ HẠNG THÀNH VIÊN */}
        <Card
          style={{
            ...customStyles.cardShadow,
            background: `linear-gradient(135deg, #fff 0%, ${currentTier.color}15 100%)`,
            border: `1px solid ${currentTier.color}40`
          }}
          bodyStyle={{ padding: 24 }}
          bordered={false}
        >
          <Row align="middle" justify="space-between">
            <Col>
              <Space align="start">
                <Avatar size={54} style={{ backgroundColor: currentTier.color }} icon={currentTier.icon} />
                <div>
                  <Title level={4} style={{ margin: 0, color: currentTier.key === 'gold' ? '#d48806' : '#333' }}>
                    {currentTier.name}
                  </Title>
                  {daysLeft > 0
                    ? <Badge status="processing" text={<Text type="success">Đang hoạt động - còn {daysLeft} ngày</Text>} />
                    : <Badge status="error" text={<Text type="danger">Hết hạn gói học</Text>} />
                  }
                </div>
              </Space>
            </Col>
            <Col style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                shape="round"
                size="large"
                onClick={() => setIsRenewModalOpen(true)}
                style={{ background: currentTier.color, borderColor: currentTier.color }}
              >
                Mua gói cước mới
              </Button>
            </Col>
          </Row>

          <Divider style={{ margin: '20px 0', borderColor: '#eee' }} />

          {/* THANH TIẾN ĐỘ LÊN HẠNG */}
          {nextTier ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text type="secondary">Tổng chi tiêu: <b style={{ color: '#333' }}>{totalSpent.toLocaleString()}đ</b></Text>
                <Text type="secondary">Mục tiêu: <b style={{ color: currentTier.color }}>{nextTier.name}</b></Text>
              </div>
              <Tooltip title={`Chi tiêu thêm ${toNextTier.toLocaleString()}đ để lên hạng ${nextTier.name}`}>
                <Progress percent={tierProgress} strokeColor={currentTier.color} trailColor="#f0f0f0" status="active" />
              </Tooltip>
              <Text style={{ fontSize: 12, color: '#888' }}>
                Cần tích lũy thêm <b>{toNextTier.toLocaleString()}đ</b> để thăng hạng.
              </Text>
            </div>
          ) : (
            <div>
              <Progress percent={100} strokeColor="#1890ff" format={() => 'MAX LEVEL'} />
              <Text type="success">Chúc mừng! Bạn đã đạt hạng thành viên cao nhất.</Text>
            </div>
          )}
        </Card>

        <Title level={5} style={{ margin: '24px 0 16px' }}><WalletOutlined /> Lịch sử giao dịch (10 gần nhất)</Title>

        {recentTransactions.length > 0 ? (
          <List
            dataSource={recentTransactions}
            renderItem={item => (
              <List.Item style={{ padding: '12px 0' }}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      style={{
                        backgroundColor: item.status === 'success' ? '#f6ffed' : '#fff1f0',
                        color: item.status === 'success' ? '#52c41a' : '#cf1322'
                      }}
                      icon={item.status === 'success' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                    />
                  }
                  title={<Text strong>{item.pkg}</Text>}
                  description={<Text type="secondary"><ClockCircleOutlined style={{ marginRight: 5 }} />{item.date}</Text>}
                />
                <div style={{ textAlign: 'right' }}>
                  <Text strong style={{ fontSize: 16, color: customStyles.primaryColor }}>{item.amount}</Text>
                  <br />
                  <Tag color={item.status === 'success' ? 'green' : (item.status === 'pending' ? 'orange' : 'default')}>
                    {item.status === 'success' ? 'Thành công' : (item.status === 'pending' ? 'Chờ duyệt' : 'Thất bại')}
                  </Tag>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="Chưa có giao dịch nào" />
        )}

        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button type="dashed" icon={<UnorderedListOutlined />} onClick={() => setIsTransactionModalOpen(true)}>
              Xem tất cả giao dịch
            </Button>
          </div>
        )}
      </div>
    );
  };

  const SettingsTab = () => (
    <Row gutter={32}>
      <Col span={24} lg={12}>
        <Card
          title={<span><EditOutlined /> Hồ sơ cá nhân</span>}
          bordered={false}
          style={{ ...customStyles.cardShadow, marginBottom: 24 }}
          headStyle={{ background: '#fafafa' }}
        >
          <Form layout="vertical" form={form} onFinish={handleUpdateInfo}>
            <Form.Item label="Họ và tên" name="name" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
              <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} size="large" />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input
                disabled
                value={profileData?.user?.email}
                prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                size="large"
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </Form.Item>
            <Form.Item label="Số điện thoại" name="phone">
              <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} size="large" />
            </Form.Item>
            <Form.Item label="Ngày sinh" name="dateOfBirth">
              <DatePicker size="large" style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item label="Giới tính" name="gender">
              <Select size="large" placeholder="Chọn giới tính">
                <Option value="male">Nam</Option>
                <Option value="female">Nữ</Option>
                <Option value="other">Khác</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Giới thiệu" name="bio">
              <Input.TextArea rows={3} placeholder="Viết vài dòng về bản thân..." />
            </Form.Item>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<CheckCircleOutlined />}
                size="large"
                loading={savingProfile}
                style={{ backgroundColor: customStyles.primaryColor, borderColor: customStyles.primaryColor }}
              >
                Lưu hồ sơ
              </Button>
            </Col>
          </Form>
        </Card>
      </Col>
      <Col span={24} lg={12}>
        <Card
          title={<span><LockOutlined /> Bảo mật</span>}
          bordered={false}
          style={customStyles.cardShadow}
          headStyle={{ background: '#fafafa' }}
        >
          {profileData?.user?.authProvider === 'google' && !hasPassword && (
            <Alert
              message="Tài khoản Google"
              description="Bạn đang đăng nhập bằng Google. Bạn có thể đặt mật khẩu để đăng nhập bằng email."
              type="info"
              icon={<GoogleOutlined />}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form layout="vertical" form={passwordForm} onFinish={handleChangePassword}>
            {hasPassword && (
              <Form.Item
                label="Mật khẩu hiện tại"
                name="currentPassword"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
              >
                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} size="large" />
              </Form.Item>
            )}
            <Form.Item
              label={hasPassword ? "Mật khẩu mới" : "Đặt mật khẩu"}
              name="newPassword"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
              ]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} size="large" />
            </Form.Item>
            <Form.Item
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} size="large" />
            </Form.Item>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Button
                type="default"
                danger
                htmlType="submit"
                size="large"
                loading={changingPassword}
              >
                {hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}
              </Button>
            </Col>
          </Form>
        </Card>
      </Col>
    </Row>
  );

  return (
    <div style={{ maxWidth: 1200, margin: '30px auto', padding: '0 20px', paddingBottom: 60 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Quay lại</Button>
        <Button type="text" icon={<ReloadOutlined />} onClick={loadProfileData}>Làm mới</Button>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={7} lg={6}>
          <Card hoverable style={{ textAlign: 'center', ...customStyles.cardShadow }} bodyStyle={{ padding: '30px 20px' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
              <Avatar
                size={120}
                src={getUserAvatar()}
                style={{ border: `4px solid ${customStyles.primaryColor}` }}
                icon={<UserOutlined />}
              />
              <Upload
                name="avatar"
                showUploadList={false}
                beforeUpload={() => false}
                onChange={handleAvatarUpload}
                accept="image/*"
              >
                <Tooltip title="Tải ảnh đại diện mới">
                  <Button
                    type="primary"
                    shape="circle"
                    icon={uploadingAvatar ? <LoadingOutlined /> : <UploadOutlined />}
                    size="middle"
                    disabled={uploadingAvatar}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: customStyles.primaryColor,
                      borderColor: customStyles.primaryColor
                    }}
                  />
                </Tooltip>
              </Upload>
            </div>
            <Title level={3} style={{ marginBottom: 4 }}>{profileData?.user?.name || userRedux?.name}</Title>
            <Text type="secondary">{profileData?.user?.email || userRedux?.email}</Text>

            {/* Hiển thị Badge Hạng ở Sidebar */}
            <div style={{ marginTop: 10 }}>
              <Tag color={currentTier.color} style={{ fontSize: 14, padding: '4px 10px' }}>
                {currentTier.icon} {currentTier.name}
              </Tag>
            </div>

            <Divider style={{ margin: '24px 0' }} />
            <div style={{ textAlign: 'left', padding: '0 10px' }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Row justify="space-between">
                  <Col><Space><SafetyCertificateOutlined style={{ color: customStyles.primaryColor }} /> <Text strong>Level:</Text></Space></Col>
                  <Col><Tag color="cyan">{getEnglishLevelDisplay(currentLevel)}</Tag></Col>
                </Row>
                <Row justify="space-between">
                  <Col><Space><CrownOutlined style={{ color: '#faad14' }} /> <Text strong>Gói:</Text></Space></Col>
                  <Col><Tag color="gold">{subscription?.plan || 'Free Member'}</Tag></Col>
                </Row>
                <Row justify="space-between">
                  <Col><Space><FireOutlined style={{ color: '#fa8c16' }} /> <Text strong>Streak:</Text></Space></Col>
                  <Col><Tag color="volcano">{learningProgress?.currentStreak || 0} ngày</Tag></Col>
                </Row>
                <Row justify="space-between">
                  <Col><Space><CalendarOutlined style={{ color: '#999' }} /> <Text type="secondary">Tham gia:</Text></Space></Col>
                  <Col><Text type="secondary">{dayjs(profileData?.stats?.memberSince).format('DD/MM/YYYY')}</Text></Col>
                </Row>
              </Space>
            </div>
            <Divider style={{ margin: '24px 0' }} />
            <Button block icon={<LogoutOutlined />} size="large" onClick={handleLogout}>Đăng xuất</Button>
          </Card>
        </Col>

        <Col xs={24} md={17} lg={18}>
          <Card style={{ ...customStyles.cardShadow, minHeight: 600 }} bodyStyle={{ padding: '24px 32px' }}>
            <Tabs
              defaultActiveKey="1"
              size="large"
              tabBarStyle={{ marginBottom: 32 }}
              items={[
                { key: '1', label: <span><BookOutlined /> Tiến độ học tập</span>, children: <LearningTab /> },
                { key: '2', label: <span><CrownOutlined /> Gói cước & Hạng thành viên</span>, children: <BillingTab /> },
                { key: '3', label: <span><EditOutlined /> Cài đặt tài khoản</span>, children: <SettingsTab /> },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* MODAL LỊCH SỬ HỌC TẬP */}
      <Modal
        title="Lịch sử học tập đầy đủ"
        open={isHistoryModalOpen}
        onCancel={() => setIsHistoryModalOpen(false)}
        footer={null}
        width={800}
        centered
      >
        <Table
          dataSource={learningHistory}
          columns={historyColumns}
          rowKey="id"
          pagination={{
            current: historyPagination.page,
            pageSize: historyPagination.limit,
            total: historyPagination.total,
            onChange: (page) => loadLearningHistory(page)
          }}
        />
      </Modal>

      {/* MODAL LỊCH SỬ GIAO DỊCH */}
      <Modal
        title="Toàn bộ lịch sử giao dịch"
        open={isTransactionModalOpen}
        onCancel={() => setIsTransactionModalOpen(false)}
        footer={null}
        width={800}
        centered
      >
        <Table
          dataSource={orderHistory}
          columns={transactionColumns}
          pagination={{ pageSize: 10 }}
          rowKey={(r, i) => i}
        />
      </Modal>

      {/* MODAL CẬP NHẬT HỌC TẬP */}
      <Modal
        title={<span><BookOutlined /> Cập nhật mục tiêu học tập</span>}
        open={isLearningSettingsOpen}
        onCancel={() => setIsLearningSettingsOpen(false)}
        footer={null}
        width={500}
        centered
      >
        <Form layout="vertical" form={learningForm} onFinish={handleUpdateLearning}>
          <Form.Item label="Trình độ hiện tại" name="englishLevel">
            <Select size="large">
              {englishLevels.map(level => (
                <Option key={level.key} value={level.key}>{level.code} - {level.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Mục tiêu" name="targetLevel">
            <Select size="large">
              {englishLevels.slice(1).map(level => (
                <Option key={level.key} value={level.key}>{level.code} - {level.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Mục tiêu học hàng tuần (giờ)" name="weeklyStudyGoal">
            <Select size="large">
              {[3, 5, 7, 10, 15, 20].map(h => (
                <Option key={h} value={h}>{h} giờ/tuần</Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsLearningSettingsOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: customStyles.primaryColor, borderColor: customStyles.primaryColor }}>
                Lưu thay đổi
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* MODAL GIA HẠN */}
      <Modal
        title={<div style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold' }}>Chọn gói nâng cấp</div>}
        open={isRenewModalOpen}
        onCancel={() => setIsRenewModalOpen(false)}
        footer={null}
        width={1000}
        centered
      >
        <div style={{ padding: '20px 0', background: '#f5f5f5', borderRadius: 8 }}>
          <Row gutter={[16, 16]} justify="center" style={{ padding: '0 16px' }}>
            {pricingPackages.map((pkg) => (
              <Col xs={24} md={8} key={pkg.id}>
                <Card
                  hoverable
                  bordered={pkg.isPopular}
                  style={{
                    textAlign: 'center',
                    height: '100%',
                    border: pkg.isPopular ? `2px solid ${pkg.color}` : '1px solid #d9d9d9',
                    transform: pkg.isPopular ? 'scale(1.05)' : 'scale(1)',
                    zIndex: pkg.isPopular ? 2 : 1,
                    borderRadius: 12
                  }}
                  bodyStyle={{ padding: '30px 20px' }}
                >
                  {pkg.isPopular && (
                    <Tag
                      color="#f50"
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        padding: '4px 10px',
                        fontSize: 12,
                        borderTopRightRadius: 12,
                        borderBottomLeftRadius: 12,
                        border: 'none'
                      }}
                    >
                      BEST SELLER
                    </Tag>
                  )}
                  <Title level={4} style={{ color: pkg.color, marginTop: 10 }}>{pkg.name}</Title>
                  <Title level={2} style={{ margin: '15px 0' }}>{pkg.price}</Title>
                  <Paragraph type="secondary" style={{ minHeight: 44, marginBottom: 24 }}>{pkg.desc}</Paragraph>
                  <Button
                    type={pkg.isPopular ? "primary" : "default"}
                    size="large"
                    shape="round"
                    block
                    style={{
                      backgroundColor: pkg.isPopular ? pkg.color : 'transparent',
                      borderColor: pkg.color,
                      color: pkg.isPopular ? '#fff' : pkg.color,
                      fontWeight: 'bold',
                      height: 45
                    }}
                    onClick={() => handleChoosePackage(pkg)}
                  >
                    Chọn gói này
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
