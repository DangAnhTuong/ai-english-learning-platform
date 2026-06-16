import React from 'react';
import { Row, Col, Typography, Card, Timeline, Avatar, Divider, Image } from 'antd';
import { RocketOutlined, HeartFilled, BulbFilled, TeamOutlined, QqOutlined } from '@ant-design/icons';
import officeImg from '../../img/nentienganhmain.jpg';

const { Title, Paragraph, Text } = Typography;
function About() {
    return (
        <div className="about-page" style={{ background: '#fff' }}>

            {/* 1. HERO BANNER: LỜI MỞ ĐẦU */}
            <div style={{
                background: 'linear-gradient(135deg, #0075F3 0%, #00c6ff 100%)',
                padding: '80px 20px',
                textAlign: 'center',
                color: '#fff'
            }}>
                <div className="container" style={{ maxWidth: 800, margin: '0 auto' }}>
                    <Title level={1} style={{ color: '#fff', marginBottom: 20 }}>Không Chỉ Là Học Tiếng Anh</Title>
                    <Paragraph style={{ fontSize: 20, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6 }}>
                        "Chúng tôi tin rằng, rào cản lớn nhất của người Việt không phải là ngữ pháp hay từ vựng,
                        mà là <b style={{ color: '#ffec3d' }}>nỗi sợ sai</b> khi mở lời."
                    </Paragraph>
                </div>
            </div>

            <div className="container" style={{ maxWidth: 1000, margin: '0 auto', padding: '60px 20px' }}>

                {/* 2. CÂU CHUYỆN KHỞI NGUỒN (THE ORIGIN) */}
                <Row gutter={[60, 40]} align="middle">
                    <Col xs={24} md={12}>
                        <Title level={2} style={{ color: '#0075F3' }}>Khởi Nguồn Của English AI</Title>
                        <Paragraph style={{ fontSize: 16, lineHeight: 1.8, color: '#555' }}>
                            Năm 2023, trong quá trình quan sát hàng ngàn học viên Việt Nam, chúng tôi nhận thấy một nghịch lý:
                            <Text strong> Rất nhiều người đạt điểm Reading/Listening rất cao, nhưng lại "đóng băng" khi gặp người nước ngoài.</Text>
                        </Paragraph>
                        <Paragraph style={{ fontSize: 16, lineHeight: 1.8, color: '#555' }}>
                            Nguyên nhân rất đơn giản: <Text italic>Sợ bị đánh giá</Text>. Thuê giáo viên bản xứ kèm 1-1 thì quá đắt đỏ, còn học trung tâm thì lớp quá đông để được nói.
                        </Paragraph>
                        <Paragraph style={{ fontSize: 16, lineHeight: 1.8, color: '#555' }}>
                            Từ trăn trở đó, <b>English AI</b> ra đời với một sứ mệnh duy nhất: Tạo ra một người bạn đồng hành ảo (AI),
                            nơi bạn có thể nói sai thoải mái, được sửa lỗi ngay lập tức mà không bao giờ cảm thấy ngại ngùng.
                        </Paragraph>
                    </Col>
                    <Col xs={24} md={12}>
                        {/* Thay ảnh minh họa phù hợp */}
                        <Card
                            bordered={false}
                            style={{
                                background: '#f0f5ff',
                                borderRadius: 20,
                                textAlign: 'center',
                                padding: 20
                            }}
                        >
                            <QqOutlined style={{ fontSize: 80, color: '#0075F3', marginBottom: 20 }} />
                            <Title level={4}>"Công nghệ sinh ra để phục vụ con người"</Title>
                            <Text type="secondary">- Đặng Anh Tường (Founder)</Text>
                        </Card>
                    </Col>
                </Row>

                <Divider style={{ margin: '60px 0' }} />

                {/* 3. DÒNG THỜI GIAN PHÁT TRIỂN */}
                <div style={{ marginBottom: 60 }}>
                    <Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>Hành Trình Của Chúng Tôi</Title>
                    <Row justify="center">
                        <Col xs={24} md={16}>
                            <Timeline mode="alternate">
                                <Timeline.Item color="green" label="2023">
                                    <h4 style={{ margin: 0 }}>Ý Tưởng Hình Thành</h4>
                                    <p>Nghiên cứu tích hợp OpenAI vào giáo dục.</p>
                                </Timeline.Item>
                                <Timeline.Item color="blue" label="Tháng 06/2024">
                                    <h4 style={{ margin: 0 }}>Phiên Bản Beta</h4>
                                    <p>Ra mắt tính năng Chat AI và Từ vựng Mindmap.</p>
                                </Timeline.Item>
                                <Timeline.Item color="red" label="Tháng 12/2024">
                                    <h4 style={{ margin: 0 }}>Luyện Hội Thoại Roleplay</h4>
                                    <p>Hoàn thiện module hội thoại nhập vai theo chủ đề.</p>
                                </Timeline.Item>
                                <Timeline.Item color="gold" label="2025">
                                    <h4 style={{ margin: 0 }}>Mục Tiêu Mới</h4>
                                    <p>Đạt 10.000 học viên và ra mắt App Mobile.</p>
                                </Timeline.Item>
                            </Timeline>
                        </Col>
                    </Row>
                </div>

                {/* 4. GIÁ TRỊ CỐT LÕI */}
                <div style={{ background: '#fafafa', padding: '40px', borderRadius: 16 }}>
                    <Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>Giá Trị Cốt Lõi</Title>
                    <Row gutter={[30, 30]}>
                        <Col xs={24} md={8}>
                            <Card hoverable style={{ textAlign: 'center', height: '100%', borderTop: '3px solid #0075F3' }}>
                                <HeartFilled style={{ fontSize: 36, color: '#ff4d4f' }} />
                                <Title level={4} style={{ marginTop: 15 }}>Thấu Cảm</Title>
                                <Paragraph type="secondary">
                                    Chúng tôi xây dựng sản phẩm dựa trên sự thấu hiểu nỗi sợ và khó khăn của người học.
                                </Paragraph>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card hoverable style={{ textAlign: 'center', height: '100%', borderTop: '3px solid #0075F3' }}>
                                <RocketOutlined style={{ fontSize: 36, color: '#13c2c2' }} />
                                <Title level={4} style={{ marginTop: 15 }}>Tiên Phong</Title>
                                <Paragraph type="secondary">
                                    Liên tục cập nhật những công nghệ AI mới nhất để tối ưu hóa trải nghiệm học tập.
                                </Paragraph>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card hoverable style={{ textAlign: 'center', height: '100%', borderTop: '3px solid #0075F3' }}>
                                <TeamOutlined style={{ fontSize: 36, color: '#faad14' }} />
                                <Title level={4} style={{ marginTop: 15 }}>Cộng Đồng</Title>
                                <Paragraph type="secondary">
                                    Không chỉ là phần mềm, chúng tôi xây dựng cộng đồng học tập tích cực và sẻ chia.
                                </Paragraph>
                            </Card>
                        </Col>
                    </Row>
                </div>

            </div>
        </div>
    );
}

export default About;