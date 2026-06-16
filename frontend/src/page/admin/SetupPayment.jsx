import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Button, Upload, message, Row, Col, 
  Typography, Alert, Image, Divider, Space, Tag, Select, Spin 
} from 'antd';
import { 
  BankOutlined, UploadOutlined, SaveOutlined, 
  QrcodeOutlined, CreditCardOutlined, DeleteOutlined, CheckCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const SetupPayment = () => {
  const [form] = Form.useForm();
  
  // State dữ liệu
  const [banks, setBanks] = useState([]); // Danh sách ngân hàng từ API
  const [loadingBanks, setLoadingBanks] = useState(false); // Loading khi tải API
  const [qrPreview, setQrPreview] = useState(null); // Ảnh QR tĩnh (Upload)
  
  // State để hiển thị Preview Realtime
  const [previewData, setPreviewData] = useState({
    bin: '',
    accountNo: '',
    accountName: '',
    template: 'compact2'
  });

  // --- 1. LOAD DANH SÁCH NGÂN HÀNG (API VIETQR) ---
  useEffect(() => {
    const fetchBanks = async () => {
      setLoadingBanks(true);
      try {
        const response = await fetch('https://api.vietqr.io/v2/banks');
        const data = await response.json();
        if (data.code === "00") {
          setBanks(data.data);
        }
      } catch (error) {
        message.error("Không tải được danh sách ngân hàng!");
      } finally {
        setLoadingBanks(false);
      }
    };
    fetchBanks();
  }, []);

  // --- 2. LOAD DATA ĐÃ LƯU TỪ LOCAL STORAGE ---
  useEffect(() => {
    const saved = localStorage.getItem('adminBankConfig');
    if (saved) {
        try {
            const parsedData = JSON.parse(saved);
            setQrPreview(parsedData.qrImage);
            
            // Set giá trị vào Form
            form.setFieldsValue({
                bankBin: parsedData.bin, // Quan trọng: Dùng BIN để định danh
                accountName: parsedData.accountName,
                accountNo: parsedData.accountNo,
                transferSyntax: parsedData.transferSyntax || 'HOCPHI'
            });

            // Set giá trị để Preview
            setPreviewData({
                bin: parsedData.bin,
                accountNo: parsedData.accountNo,
                accountName: parsedData.accountName
            });
        } catch (error) {
            console.error(error);
        }
    }
  }, [form]);

  // --- 3. XỬ LÝ KHI FORM THAY ĐỔI (REALTIME PREVIEW) ---
  const handleValuesChange = (changedValues, allValues) => {
    setPreviewData(prev => ({
        ...prev,
        bin: allValues.bankBin,
        accountNo: allValues.accountNo,
        accountName: allValues.accountName ? allValues.accountName.toUpperCase() : ''
    }));
  };

  // --- 4. XỬ LÝ LƯU ---
  const handleSave = (values) => {
    // Tìm thông tin ngân hàng đầy đủ dựa trên BIN đã chọn
    const selectedBankInfo = banks.find(b => b.bin === values.bankBin);

    const upperCaseName = values.accountName ? values.accountName.toUpperCase() : '';
    const upperSyntax = values.transferSyntax ? values.transferSyntax.toUpperCase() : 'HOCPHI';

    const newConfig = {
        ...values,
        bankName: selectedBankInfo ? selectedBankInfo.shortName : '', // Lưu tên để hiển thị
        bankLogo: selectedBankInfo ? selectedBankInfo.logo : '',      // Lưu logo
        bin: values.bankBin,
        accountName: upperCaseName,
        transferSyntax: upperSyntax,
        qrImage: qrPreview // Nếu có ảnh upload
    };

    try {
        localStorage.setItem('adminBankConfig', JSON.stringify(newConfig));
        message.success('Đã lưu cấu hình thành công!');
        // Update lại form cho đẹp
        form.setFieldsValue({ 
            accountName: upperCaseName,
            transferSyntax: upperSyntax
        });
    } catch (e) {
        message.error('Dữ liệu quá lớn (do ảnh upload). Hãy xóa ảnh upload và dùng QR động!');
    }
  };

  // --- 5. TẠO URL QR CODE ĐỘNG ---
  // Nếu không có ảnh upload (qrPreview), thì dùng link từ VietQR
  const dynamicQrUrl = (previewData.bin && previewData.accountNo) 
    ? `https://img.vietqr.io/image/${previewData.bin}-${previewData.accountNo}-compact2.png?accountName=${encodeURIComponent(previewData.accountName)}`
    : null;

  // Ưu tiên hiển thị: Ảnh upload -> Ảnh động -> Null
  const displayImage = qrPreview || dynamicQrUrl;

  // --- 6. XỬ LÝ UPLOAD ẢNH (GIỮ NGUYÊN CODE CŨ CỦA BẠN) ---
  const handleQrUpload = ({ file }) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
        message.error('Chỉ được upload file ảnh!');
        return Upload.LIST_IGNORE;
    }
    const isLt4M = file.size / 1024 / 1024 < 4;
    if (!isLt4M) {
        message.error('Ảnh phải nhỏ hơn 4MB!');
        return Upload.LIST_IGNORE;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        setQrPreview(reader.result);
        message.success('Đã tải ảnh lên.');
    };
    return false; 
  };

  return (
    <Card 
      title="Cấu hình Thanh toán & Nội dung chuyển khoản" 
      bordered={false}
      extra={<Tag color="blue">Hệ thống VietQR</Tag>}
    >
      <Alert 
        message="Thông tin quan trọng"
        description="Hệ thống tự động tạo mã QR chính xác theo chuẩn VietQR/Napas. Bạn chỉ cần chọn ngân hàng và nhập số tài khoản."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Form 
        layout="vertical" 
        form={form} 
        onFinish={handleSave}
        onValuesChange={handleValuesChange} // Lắng nghe thay đổi để cập nhật Preview
      >
        <Row gutter={40}>
            {/* CỘT TRÁI: THÔNG TIN TÀI KHOẢN */}
            <Col xs={24} lg={14}>
                <Card type="inner" title={<span><BankOutlined /> Thông tin tài khoản</span>}>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item 
                                label="Ngân hàng thụ hưởng" 
                                name="bankBin" 
                                rules={[{ required: true, message: 'Vui lòng chọn ngân hàng' }]}
                            >
                                <Select 
                                    placeholder="Chọn ngân hàng" 
                                    loading={loadingBanks}
                                    showSearch
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    size="large"
                                >
                                    {banks.map(bank => (
                                        <Option key={bank.id} value={bank.bin} label={bank.shortName + ' ' + bank.name}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <img 
                                                    src={bank.logo} 
                                                    alt={bank.shortName} 
                                                    style={{ width: 60, height: 30, objectFit: 'contain', marginRight: 10 }} 
                                                />
                                                <span>{bank.shortName} - {bank.name}</span>
                                            </div>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                             <Form.Item label="Số tài khoản" name="accountNo" rules={[{ required: true }]}>
                                <Input prefix={<CreditCardOutlined />} placeholder="VD: 1900123456789" size="large"/>
                            </Form.Item>
                        </Col>
                        
                        <Col span={12}>
                             <Form.Item label="Chủ tài khoản" name="accountName" rules={[{ required: true }]}>
                                <Input placeholder="NGUYEN VAN A" style={{ textTransform: 'uppercase' }} size="large"/>
                            </Form.Item>
                        </Col>
                        
                        <Col span={24}>
                            <Divider orientation="left" style={{fontSize: 14, color: '#888'}}>Nội dung chuyển khoản</Divider>
                            <Form.Item 
                                label="Cú pháp (Prefix)" 
                                name="transferSyntax" 
                                initialValue="HOCPHI"
                                help={
                                    <div style={{marginTop: 5}}>
                                        Học viên sẽ thấy: <Tag color="green">{previewData.transferSyntax || 'HOCPHI'} {`MÃ_ĐƠN`}</Tag>
                                    </div>
                                }
                            >
                                <Input 
                                    placeholder="VD: HOCPHI" 
                                    style={{ textTransform: 'uppercase' }} 
                                    addonAfter={<Text strong>+ Mã Đơn</Text>}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>
                
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" style={{ marginTop: 24, width: '100%', height: 45 }}>
                    LƯU CẤU HÌNH THANH TOÁN
                </Button>
            </Col>

            {/* CỘT PHẢI: PREVIEW */}
            <Col xs={24} lg={10}>
                <Card 
                    type="inner" 
                    title={<span><CheckCircleOutlined /> Xem trước hiển thị (Preview)</span>} 
                    style={{textAlign: 'center', height: '100%', background: '#f9f9f9'}}
                >
                    <div style={{ 
                        background: 'white', padding: 20, borderRadius: 12, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                        display: 'inline-block', minWidth: 280
                    }}>
                        {/* Khu vực hiển thị ảnh QR */}
                        {displayImage ? (
                            <Image 
                                src={displayImage} 
                                alt="QR Code" 
                                width={250}
                                placeholder={<Spin />}
                            />
                        ) : (
                            <div style={{ height: 250, width: 250, background: '#f0f2f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto', borderRadius: 8 }}>
                                <QrcodeOutlined style={{ fontSize: 40, color: '#ccc' }} />
                                <Text type="secondary" style={{marginTop: 10}}>Vui lòng nhập thông tin</Text>
                            </div>
                        )}

                        <div style={{ marginTop: 20, textAlign: 'left', borderTop: '1px dashed #eee', paddingTop: 15 }}>
                            <div style={{ fontSize: 12, color: '#888' }}>Chủ tài khoản:</div>
                            <div style={{ fontWeight: 'bold', fontSize: 16, color: '#1890ff' }}>
                                {previewData.accountName || 'CHƯA NHẬP TÊN'}
                            </div>
                            
                            <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>Số tài khoản:</div>
                            <div style={{ fontWeight: 'bold', fontSize: 16 }}>
                                {previewData.accountNo || '...'}
                            </div>
                        </div>
                    </div>

                    <Divider>Hoặc dùng ảnh tĩnh</Divider>

                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Upload 
                            showUploadList={false} 
                            beforeUpload={(file) => handleQrUpload({ file })}
                            accept="image/*"
                        >
                            <Button icon={<UploadOutlined />}>Tải lên ảnh QR cá nhân</Button>
                        </Upload>
                        
                        {qrPreview && (
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setQrPreview(null)}>
                                Xóa ảnh tải lên (Dùng VietQR)
                            </Button>
                        )}
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            * Khuyến khích KHÔNG tải ảnh lên để hệ thống tự động tạo QR kèm nội dung chuyển khoản chính xác.
                        </Text>
                    </Space>
                </Card>
            </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default SetupPayment;