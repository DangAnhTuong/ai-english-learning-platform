import React, { useState } from 'react';
import { Card, Input, Button, Typography, Row, Col, message, Divider, Steps } from 'antd';
import { GiftOutlined, SketchOutlined, CheckCircleFilled, RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

function ActivateCode() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleActivate = () => {
        if (!code) {
            message.error('Vui lòng nhập mã kích hoạt!');
            return;
        }

        setLoading(true);

        // Giả lập gọi API kiểm tra mã (Delay 1.5 giây)
        setTimeout(() => {
            setLoading(false);
            if (code.toUpperCase() === 'VIP2025') {
                message.success('Chúc mừng! Tài khoản của bạn đã được nâng cấp lên PRO.');
                // Chuyển hướng về trang chủ hoặc trang khóa học sau khi thành công
                navigate('/');
            } else {
                message.error('Mã kích hoạt không hợp lệ hoặc đã hết hạn.');
            }
        }, 1500);
    };

    return (
        <div className="activate-page" style={{ background: '#f0f2f5', minHeight: '90vh', padding: '60px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="container" style={{ maxWidth: 900, width: '100%' }}>

                <Row gutter={[40, 40]} align="middle">

                    {/* CỘT TRÁI: GIỚI THIỆU QUYỀN LỢI */}
                    <Col xs={24} md={12}>
                        <div style={{ paddingRight: 20 }}>
                            <Title level={2} style={{ color: '#0075F3' }}>
                                <SketchOutlined style={{ marginRight: 10, color: '#faad14' }} />
                                Kích Hoạt Premium
                            </Title>
                            <Paragraph style={{ fontSize: 16 }}>
                                Nhập mã code bạn nhận được để mở khóa toàn bộ tính năng cao cấp của English AI.
                            </Paragraph>

                            <Divider />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                                <Text strong style={{ fontSize: 16 }}><CheckCircleFilled style={{ color: '#52c41a', marginRight: 10 }} /> Mở khóa 100+ chủ đề hội thoại</Text>
                                <Text strong style={{ fontSize: 16 }}><CheckCircleFilled style={{ color: '#52c41a', marginRight: 10 }} /> Luyện nói không giới hạn cùng AI</Text>
                                <Text strong style={{ fontSize: 16 }}><CheckCircleFilled style={{ color: '#52c41a', marginRight: 10 }} /> Tạo lộ trình học cá nhân hóa</Text>
                                <Text strong style={{ fontSize: 16 }}><CheckCircleFilled style={{ color: '#52c41a', marginRight: 10 }} /> Không chứa quảng cáo</Text>
                            </div>
                        </div>
                    </Col>

                    {/* CỘT PHẢI: FORM NHẬP MÃ */}
                    <Col xs={24} md={12}>
                        <Card
                            style={{
                                borderRadius: 16,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                borderTop: '6px solid #faad14',
                                textAlign: 'center',
                                padding: 20
                            }}
                        >
                            <GiftOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 20 }} />
                            <Title level={3}>Nhập mã kích hoạt</Title>
                            <Paragraph type="secondary">Mã bao gồm chữ và số in trên thẻ hoặc email.</Paragraph>

                            <Input
                                size="large"
                                placeholder="VD: VIP-1234-5678"
                                style={{
                                    textAlign: 'center',
                                    fontSize: 18,
                                    letterSpacing: 2,
                                    textTransform: 'uppercase',
                                    height: 50,
                                    marginBottom: 20,
                                    borderRadius: 8
                                }}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                onPressEnter={handleActivate}
                            />

                            <Button
                                type="primary"
                                size="large"
                                block
                                loading={loading}
                                onClick={handleActivate}
                                style={{
                                    height: 50,
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                    borderRadius: 8,
                                    background: 'linear-gradient(to right, #faad14, #fadb14)',
                                    border: 'none',
                                    color: '#fff'
                                }}
                                icon={<RocketOutlined />}
                            >
                                KÍCH HOẠT NGAY
                            </Button>

                            <div style={{ marginTop: 20, fontSize: 13, color: '#999' }}>
                                Gặp sự cố?{' '}
                                <span
                                    style={{ color: '#0075F3', cursor: 'pointer', fontWeight: 'bold' }}
                                    onClick={() => navigate('/contact')} // <-- Thêm dòng này để chuyển trang
                                >
                                    Liên hệ hỗ trợ
                                </span>
                            </div>
                        </Card>
                    </Col>
                </Row>

            </div>
        </div>
    );
}

export default ActivateCode;