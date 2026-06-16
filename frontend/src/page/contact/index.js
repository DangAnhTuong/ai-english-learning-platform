import React from 'react';
import { Row, Col, Typography, Form, Input, Button, Card, message } from 'antd';
import { MailOutlined, PhoneOutlined, EnvironmentOutlined, SendOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

function Contact() {
    const [form] = Form.useForm();

    const onFinish = (values) => {
        console.log('Success:', values);
        // Sau này sẽ gọi API gửi mail ở đây
        message.success('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.');
        form.resetFields();
    };

    return (
        <div className="contact-page" style={{ padding: '60px 20px', background: '#f0f2f5', minHeight: '80vh' }}>
            <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
                
                {/* TIÊU ĐỀ */}
                <div style={{ textAlign: 'center', marginBottom: 50 }}>
                    <Title level={1} style={{ color: '#0075F3' }}>Liên Hệ Với Chúng Tôi</Title>
                    <Paragraph style={{fontSize: 16}}>Luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc của bạn.</Paragraph>
                </div>

                <Row gutter={[40, 40]}>
                    {/* CỘT TRÁI: THÔNG TIN LIÊN HỆ */}
                    <Col xs={24} md={10}>
                        <Card style={{ height: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <Title level={3} style={{ color: '#0075F3', marginBottom: 30 }}>Thông tin trụ sở</Title>
                            
                            <div style={{ marginBottom: 25, display: 'flex', alignItems: 'flex-start' }}>
                                <EnvironmentOutlined style={{ fontSize: 24, color: '#faad14', marginRight: 15, marginTop: 5 }} />
                                <div>
                                    <Text strong style={{ fontSize: 16 }}>Địa chỉ:</Text>
                                    <Paragraph style={{ color: '#666', margin: 0 }}>
                                        Tòa nhà English AI, Đặng Thùy Trâm, Phường 13, Quận Bình Thạnh, TP. Hồ Chí Minh.
                                    </Paragraph>
                                </div>
                            </div>

                            <div style={{ marginBottom: 25, display: 'flex', alignItems: 'flex-start' }}>
                                <PhoneOutlined style={{ fontSize: 24, color: '#faad14', marginRight: 15, marginTop: 5 }} />
                                <div>
                                    <Text strong style={{ fontSize: 16 }}>Hotline:</Text>
                                    <Paragraph style={{ color: '#666', margin: 0 }}>
                                        +84 942 334 470  (8:00 - 21:00)
                                    </Paragraph>
                                </div>
                            </div>

                            <div style={{ marginBottom: 25, display: 'flex', alignItems: 'flex-start' }}>
                                <MailOutlined style={{ fontSize: 24, color: '#faad14', marginRight: 15, marginTop: 5 }} />
                                <div>
                                    <Text strong style={{ fontSize: 16 }}>Email:</Text>
                                    <Paragraph style={{ color: '#666', margin: 0 }}>
                                        letrithieng@gmail.com
                                    </Paragraph>
                                </div>
                            </div>

                            {/* Bản đồ (Google Map ) */}
                            <div style={{ marginTop: 30, borderRadius: 12, overflow: 'hidden', border: '1px solid #eee' }}>
                                <iframe 
                                    title="Google Map"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.857631278857!2d106.6853!3d10.8231!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528e5496d5c1d%3A0x...!!!2sEnglishAI" 
                                    width="100%" 
                                    height="250" 
                                    style={{ border: 0 }} 
                                    allowFullScreen="" 
                                    loading="lazy"
                                ></iframe>
                            </div>
                        </Card>
                    </Col>

                    {/* CỘT PHẢI: FORM GỬI TIN NHẮN */}
                    <Col xs={24} md={14}>
                        <Card style={{ height: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <Title level={3} style={{ marginBottom: 30 }}>Gửi tin nhắn</Title>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                                size="large"
                            >
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                                            <Input placeholder="Nguyễn Văn A" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="phone" label="Số điện thoại">
                                            <Input placeholder="09xxxxxx" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}>
                                    <Input placeholder="email@example.com" />
                                </Form.Item>

                                <Form.Item name="message" label="Nội dung cần hỗ trợ" rules={[{ required: true, message: 'Vui lòng nhập nội dung!' }]}>
                                    <TextArea rows={5} placeholder="Tôi cần tư vấn về khóa học..." />
                                </Form.Item>

                                <Form.Item>
                                    <Button type="primary" htmlType="submit" icon={<SendOutlined />} style={{ width: '100%', height: 50, borderRadius: 8, fontSize: 16, fontWeight: 'bold' }}>
                                        GỬI NGAY
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

export default Contact;