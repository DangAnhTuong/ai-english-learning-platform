import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Card, Row, Col, Typography, Button, Descriptions, message, Spin, Result, Tag, Alert, Tooltip 
} from 'antd';
import { 
  CheckCircleOutlined, CopyOutlined, LoadingOutlined, 
  SafetyCertificateFilled, CrownFilled, ArrowRightOutlined,
  ThunderboltFilled, BookOutlined, CustomerServiceOutlined
} from '@ant-design/icons';
import { paymentService } from '../../services/paymentService';
import { loginSuccess } from '../../redux/authSlice';

const { Title, Text, Paragraph } = Typography;

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isLogin, accessToken, refreshToken } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [paidInfo, setPaidInfo] = useState(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 phút đếm ngược
  const [simulating, setSimulating] = useState(false);
  const pollingRef = useRef(null);

  // 1. Kiểm tra đăng nhập
  useEffect(() => {
    if (!isLogin) {
      message.warning('Vui lòng đăng nhập để tiến hành thanh toán');
      navigate('/login');
    }
  }, [isLogin, navigate]);

  // 2. Tạo đơn hàng khi vào trang
  useEffect(() => {
    if (!isLogin) return;

    let isMounted = true;
    const initOrder = async () => {
      try {
        setLoading(true);
        const incoming = location.state?.selectedPackage;
        const payload = {};

        if (incoming?.courseId) {
          payload.courseId = incoming.courseId;
        } else if (incoming?.id === 1) {
          payload.planId = 'vip_1_month';
        } else if (incoming?.id === 2) {
          payload.planId = 'vip_3_months';
        } else if (incoming?.id === 3) {
          payload.planId = 'vip_12_months';
        } else {
          payload.planId = 'vip_3_months'; // Mặc định gói phổ biến
        }

        const res = await paymentService.createOrder(payload);
        if (isMounted && res.success && res.data) {
          setOrderData(res.data);
        }
      } catch (err) {
        console.error('Create order error:', err);
        message.error('Không thể tạo đơn hàng. Vui lòng thử lại!');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initOrder();

    return () => {
      isMounted = false;
    };
  }, [isLogin, location.state]);

  // 3. Real-time Polling: Kiểm tra trạng thái đơn hàng mỗi 2.5s
  useEffect(() => {
    if (!orderData?.orderCode || isPaid) return;

    const checkStatus = async () => {
      try {
        const res = await paymentService.checkOrderStatus(orderData.orderCode);
        if (res.success && res.data?.isPaid) {
          setIsPaid(true);
          setPaidInfo(res.data);
          clearInterval(pollingRef.current);
          message.success('🎉 Thanh toán thành công! Tài khoản đã được nâng cấp VIP.');

          // Cập nhật Redux User State nếu có
          if (user) {
            dispatch(loginSuccess({
              user: {
                ...user,
                activeSubscriptionId: res.data.subscription?._id || 'active_vip'
              },
              accessToken,
              refreshToken
            }));
          }
        }
      } catch (e) {
        // Silent catch for polling
      }
    };

    pollingRef.current = setInterval(checkStatus, 2500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [orderData, isPaid, user, accessToken, refreshToken, dispatch]);

  // 4. Đồng hồ đếm ngược 15 phút
  useEffect(() => {
    if (isPaid || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaid, timeLeft]);

  // Copy helper
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    message.success(`Đã sao chép ${label}!`);
  };

  // Format countdown mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Format tiền tệ VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  // Demo Simulation Handler
  const handleSimulatePayment = async () => {
    if (!orderData?.orderCode) return;
    try {
      setSimulating(true);
      const res = await paymentService.simulatePayment(orderData.orderCode);
      if (res.success) {
        setIsPaid(true);
        setPaidInfo(res.data);
        message.success('⚡ Giả lập thanh toán thành công! Tài khoản đã lên VIP.');
        if (user) {
          dispatch(loginSuccess({
            user: {
              ...user,
              activeSubscriptionId: 'active_vip_demo'
            },
            accessToken,
            refreshToken
          }));
        }
      }
    } catch (e) {
      message.error('Lỗi khi giả lập thanh toán');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px' }}>
        <Spin size="large" tip="Đang kết nối hệ thống ngân hàng SePay..." />
      </div>
    );
  }

  // --- MÀN HÌNH THANH TOÁN THÀNH CÔNG ---
  if (isPaid) {
    return (
      <div style={{ maxWidth: 700, margin: '60px auto', padding: '0 20px' }}>
        <Card style={{ borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <Result
            status="success"
            icon={<CrownFilled style={{ color: '#faad14', fontSize: 72 }} />}
            title={<Title level={2} style={{ color: '#1890ff', marginTop: 10 }}>Chúc Mừng Bạn Đã Lên VIP!</Title>}
            subTitle={
              <Paragraph style={{ fontSize: 16, color: '#555', marginTop: 8 }}>
                Giao dịch của đơn hàng <b>{orderData?.orderCode}</b> đã được hệ thống ngân hàng SePay tự động xác nhận thành công.
                Toàn bộ tính năng AI, luyện hội thoại và khóa học đã được kích hoạt trọn vẹn!
              </Paragraph>
            }
            extra={[
              <Button 
                type="primary" 
                size="large" 
                key="courses" 
                icon={<BookOutlined />}
                style={{ height: 46, padding: '0 28px', borderRadius: 8, fontSize: 16 }}
                onClick={() => navigate('/courses')}
              >
                Khám phá khóa học
              </Button>,
              <Button 
                size="large" 
                key="conversation" 
                icon={<CustomerServiceOutlined />}
                style={{ height: 46, padding: '0 28px', borderRadius: 8, fontSize: 16 }}
                onClick={() => navigate('/conversation')}
              >
                Luyện hội thoại AI ngay
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  // --- MÀN HÌNH CHỜ QUÉT MÃ VIETQR ---
  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <Title level={2} style={{ marginBottom: 6 }}>Thanh Toán Chuyển Khoản Tự Động (VietQR)</Title>
        <Text type="secondary" style={{ fontSize: 15 }}>
          Hệ thống tự động kích hoạt VIP trong <b>3-5 giây</b> ngay sau khi bạn hoàn tất chuyển khoản
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* CỘT TRÁI: MÃ QR & TRẠNG THÁI REALTIME */}
        <Col xs={24} md={11}>
          <Card 
            style={{ 
              borderRadius: 16, 
              textAlign: 'center', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              borderTop: '4px solid #1890ff'
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px', borderRadius: 6 }}>
                Giao dịch an toàn SePay
              </Tag>
            </div>

            {/* ẢNH VIETQR */}
            <div style={{ 
              background: '#f9fbfd', 
              padding: 16, 
              borderRadius: 12, 
              display: 'inline-block',
              border: '1px solid #e8e8e8',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)'
            }}>
              <img 
                src={orderData?.qrUrl} 
                alt="VietQR Chuyển khoản" 
                style={{ width: '100%', maxWidth: 280, height: 'auto', display: 'block', borderRadius: 8 }} 
              />
            </div>

            {/* Trạng thái Polling Realtime */}
            <div style={{ marginTop: 20, padding: '12px 16px', background: '#e6f7ff', borderRadius: 8, border: '1px solid #91d5ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <LoadingOutlined style={{ color: '#1890ff', fontSize: 18 }} spin />
                <Text strong style={{ color: '#0050b3' }}>
                  Đang chờ tín hiệu ngân hàng... ({formatTime(timeLeft)})
                </Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                Vui lòng giữ nguyên trang này hoặc không tắt ứng dụng
              </Text>
            </div>
          </Card>
        </Col>

        {/* CỘT PHẢI: THÔNG TIN CHI TIẾT & NÚT COPY */}
        <Col xs={24} md={13}>
          <Card 
            title={<span style={{ fontSize: 17, fontWeight: 'bold' }}>Thông Tin Chuyển Khoản Chính Xác</span>}
            style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
            extra={<Tag color="gold" icon={<CrownFilled />}>{orderData?.planName}</Tag>}
          >
            <Alert
              message="Lưu ý cực kỳ quan trọng"
              description="Bạn vui lòng giữ NGUYÊN NỘI DUNG CHUYỂN KHOẢN để hệ thống SePay tự động nhận diện và kích hoạt tài khoản ngay lập tức."
              type="warning"
              showIcon
              style={{ marginBottom: 20, borderRadius: 8 }}
            />

            <Descriptions column={1} bordered size="middle" labelStyle={{ width: '38%', fontWeight: 600 }}>
              <Descriptions.Item label="Ngân hàng">
                <b>MB Bank (Ngân hàng Quân Đội)</b>
              </Descriptions.Item>

              <Descriptions.Item label="Chủ tài khoản">
                <b>{orderData?.bankInfo?.accountName || 'DANG ANH TUONG'}</b>
              </Descriptions.Item>

              <Descriptions.Item label="Số tài khoản">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ fontSize: 17, color: '#1890ff' }}>
                    {orderData?.bankInfo?.accountNo || '0335847674'}
                  </b>
                  <Button 
                    size="small" 
                    icon={<CopyOutlined />} 
                    onClick={() => copyToClipboard(orderData?.bankInfo?.accountNo || '0335847674', 'Số tài khoản')}
                  >
                    Sao chép
                  </Button>
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Số tiền thanh toán">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ fontSize: 18, color: '#f5222d' }}>
                    {formatCurrency(orderData?.amount || 0)}
                  </b>
                  <Button 
                    size="small" 
                    icon={<CopyOutlined />} 
                    onClick={() => copyToClipboard(orderData?.amount?.toString(), 'Số tiền')}
                  >
                    Sao chép
                  </Button>
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Nội dung chuyển">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ fontSize: 18, color: '#52c41a', background: '#f6ffed', padding: '2px 8px', borderRadius: 4, border: '1px solid #b7eb8f' }}>
                    {orderData?.transferContent || orderData?.orderCode}
                  </b>
                  <Button 
                    size="small" 
                    type="primary"
                    ghost
                    icon={<CopyOutlined />} 
                    onClick={() => copyToClipboard(orderData?.transferContent || orderData?.orderCode, 'Nội dung chuyển')}
                  >
                    Sao chép
                  </Button>
                </div>
              </Descriptions.Item>
            </Descriptions>

            {/* DÀNH CHO NHÀ TUYỂN DỤNG & TEST NHANH */}
            <div style={{ marginTop: 24, padding: '16px', background: '#fafafa', borderRadius: 10, border: '1px dashed #d9d9d9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#333' }}>
                    <ThunderboltFilled style={{ color: '#faad14', marginRight: 6 }} />
                    Dành Cho Nhà Tuyển Dụng / Kiểm Thử (Demo Mode)
                  </div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Kiểm tra luồng tự động nhận diện và lên VIP tức thì mà không cần chuyển tiền thật
                  </Text>
                </div>
                <Button 
                  type="primary" 
                  danger 
                  loading={simulating}
                  onClick={handleSimulatePayment}
                  style={{ borderRadius: 6 }}
                >
                  ⚡ Kích Hoạt Nhanh (Demo)
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PaymentPage;
