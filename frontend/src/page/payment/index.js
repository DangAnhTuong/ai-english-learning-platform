import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Card, Row, Col, Typography, Button, Descriptions, message, Spin, Result, Alert, Divider 
} from 'antd';
import { 
  CheckCircleOutlined, LeftOutlined, SafetyCertificateFilled, BankOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { orderService } from '../../services/orderService';

const { Title, Text } = Typography;

// --- HÀM HỖ TRỢ: XÓA DẤU TIẾNG VIỆT ---
const removeVietnameseTones = (str) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
}

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLogin } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLogin) {
      navigate('/login');
    }
  }, [isLogin, navigate]);

  // --- 1. LẤY DỮ LIỆU GÓI CƯỚC ---
  const incomingPackage = location.state?.selectedPackage;

  const planData = incomingPackage ? {
      name: incomingPackage.name,
      price: incomingPackage.value || incomingPackage.price || 0,
      duration: incomingPackage.id === 1 ? 1 : (incomingPackage.id === 2 ? 3 : 12)
  } : {
      name: 'Gói Tiêu Chuẩn', 
      price: 199000,
      duration: 1
  };

  // --- 2. LẤY CẤU HÌNH TỪ ADMIN ---
  const storedConfig = JSON.parse(localStorage.getItem('adminBankConfig')) || {};
  
  const BANK_INFO = {
    BANK_NAME: storedConfig.bankName || 'MB Bank',
    ACCOUNT_NO: storedConfig.accountNo || '0000000000',
    ACCOUNT_NAME: storedConfig.accountName || 'CHUA CAU HINH',
    QR_IMAGE: storedConfig.qrImage || null,
    SYNTAX: storedConfig.transferSyntax || 'HOCPHI' 
  };

  // --- 3. XỬ LÝ NỘI DUNG CHUYỂN KHOẢN ---
  const unsignedName = removeVietnameseTones(planData.name);
  const cleanPlanName = unsignedName.replace(/\s/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const transferContent = `${BANK_INFO.SYNTAX} ${cleanPlanName}`;

  // --- 4. TẠO LINK QR ---
  const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.BANK_NAME.replace(/\s/g, '')}-${BANK_INFO.ACCOUNT_NO}-compact.png?amount=${planData.price}&addInfo=${encodeURIComponent(transferContent)}`;
  const displayQrSource = BANK_INFO.QR_IMAGE ? BANK_INFO.QR_IMAGE : qrUrl;

  // --- [QUAN TRỌNG] HÀM XỬ LÝ THANH TOÁN KHỚP VỚI ADMIN ---
  const handleConfirmPayment = async () => {
    if (!isLogin) {
      message.error('Vui lòng đăng nhập để tiếp tục');
      navigate('/login');
      return;
    }

    setLoading(true);
    
    try {
      // 1. Tạo đơn hàng qua API
      const orderData = {
        package: {
          name: planData.name,
          duration: planData.duration * 30, // Convert months to days
          plan: 'basic' // Có thể map từ planData nếu có
        },
        amount: planData.price,
        currency: 'VND',
        paymentMethod: 'bank_transfer',
        transferContent: transferContent,
        bankInfo: {
          bankName: BANK_INFO.BANK_NAME,
          accountNo: BANK_INFO.ACCOUNT_NO,
          accountName: BANK_INFO.ACCOUNT_NAME
        },
        metadata: {
          ipAddress: null, // Có thể lấy từ request nếu cần
          userAgent: navigator.userAgent,
          referrer: document.referrer
        }
      };

      const response = await orderService.createOrder(orderData);
      
      if (response.success && response.data.order) {
        setOrderId(response.data.order._id || response.data.order.id);
        setIsSuccess(true);
        message.success('Đã tạo đơn hàng thành công! Vui lòng chờ admin xác nhận thanh toán.');
      } else {
        throw new Error(response.message || 'Không thể tạo đơn hàng');
      }
    } catch (error) {
      console.error('Create order error:', error);
      
      // Handle validation errors with details
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors.map(err => `${err.field}: ${err.message}`).join(', ');
        message.error(`Dữ liệu không hợp lệ: ${errorMessages}`);
      } else {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Không thể tạo đơn hàng. Vui lòng thử lại!';
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
        <Result
            status="success"
            title="Gửi xác nhận thành công!"
            subTitle="Admin đã nhận được yêu cầu. Vui lòng chờ 5-10 phút để hệ thống kích hoạt khóa học."
            extra={[
                <Button type="primary" key="console" onClick={() => navigate('/profile')}>
                    Xem lịch sử
                </Button>,
                <Button key="buy" onClick={() => navigate('/')}>Về trang chủ</Button>,
            ]}
            style={{ marginTop: 50 }}
        />
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: '0 20px' }}>
      <Button icon={<LeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>Quay lại</Button>
      
      <Row gutter={[40, 40]}>
        {/* CỘT TRÁI: QR CODE */}
        <Col xs={24} md={14}>
            <Card title={<span><BankOutlined /> Cổng thanh toán</span>} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 12 }}>
                <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ color: '#0075F3', marginBottom: 5 }}>QUÉT MÃ ĐỂ THANH TOÁN</Title>
                    <Text type="secondary">Sử dụng App Ngân hàng hoặc Ví điện tử</Text>
                    
                    <div style={{ margin: '20px 0', padding: 10, border: '2px dashed #0075F3', borderRadius: 12, display: 'inline-block' }}>
                         {/* Hiển thị QR */}
                        <img 
                            src={displayQrSource} 
                            alt="QR Code" 
                            style={{ width: '100%', maxWidth: 300, display: 'block', borderRadius: 8 }} 
                        />
                    </div>
                    
                    {BANK_INFO.QR_IMAGE && (
                         <Alert 
                            message="Lưu ý: Ảnh QR Tĩnh" 
                            description="Vì đây là ảnh tĩnh, vui lòng nhập chính xác nội dung bên dưới khi chuyển khoản." 
                            type="warning" 
                            showIcon 
                            style={{textAlign: 'left', marginBottom: 15}}
                        />
                    )}

                    <div style={{ marginTop: 10, background: '#f5f7fa', padding: 20, borderRadius: 8, textAlign: 'left' }}>
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <Text type="secondary">Ngân hàng:</Text><br/>
                                <Text strong style={{fontSize: 16}}>{BANK_INFO.BANK_NAME}</Text>
                            </Col>
                            <Col span={24}>
                                <Text type="secondary">Số tài khoản:</Text><br/>
                                <Text copyable={{text: BANK_INFO.ACCOUNT_NO}} strong style={{fontSize: 18, color: '#0075F3'}}>{BANK_INFO.ACCOUNT_NO}</Text>
                            </Col>
                            <Col span={24}>
                                <Text type="secondary">Chủ tài khoản:</Text><br/>
                                <Text strong style={{fontSize: 16}}>{BANK_INFO.ACCOUNT_NAME}</Text>
                            </Col>
                            <Col span={24}>
                                <Divider style={{margin: '10px 0'}} />
                                <Text type="secondary">Nội dung chuyển khoản (Bắt buộc):</Text><br/>
                                <Text copyable={{text: transferContent}} type="danger" strong style={{fontSize: 18, background: '#fff1f0', padding: '8px 12px', borderRadius: 4, display: 'block', marginTop: 5, border: '1px dashed #ffa39e'}}>
                                    {transferContent}
                                </Text>
                            </Col>
                        </Row>
                    </div>
                </div>
            </Card>
        </Col>

        {/* CỘT PHẢI: THÔNG TIN GÓI */}
        <Col xs={24} md={10}>
            <Card title="Thông tin đơn hàng" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 12, height: '100%' }}>
                <Descriptions column={1} layout="vertical" bordered>
                    <Descriptions.Item label="Gói đăng ký"><Title level={5} style={{ margin: 0, color: '#faad14' }}>{planData.name}</Title></Descriptions.Item>
                    <Descriptions.Item label="Thời hạn">{planData.duration} Tháng</Descriptions.Item>
                    <Descriptions.Item label="Tổng thanh toán"><Title level={3} style={{ margin: 0, color: '#0075F3' }}>{planData.price.toLocaleString('vi-VN')}đ</Title></Descriptions.Item>
                </Descriptions>
                
                <div style={{ marginTop: 24 }}>
                    <Alert 
                        message="Bảo mật thanh toán" 
                        description="Giao dịch của bạn được mã hóa và bảo vệ an toàn tuyệt đối." 
                        type="success" 
                        showIcon 
                        icon={<SafetyCertificateFilled />}
                        style={{marginBottom: 16}}
                    />
                    
                    <Button type="primary" size="large" block icon={loading ? <Spin /> : <CheckCircleOutlined />} onClick={handleConfirmPayment} disabled={loading} style={{height: 50, fontSize: 16}}>
                        {loading ? 'Đang xác thực...' : 'Xác nhận đã chuyển khoản'}
                    </Button>
                </div>
            </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PaymentPage;