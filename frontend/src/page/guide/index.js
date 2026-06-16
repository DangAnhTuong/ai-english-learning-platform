import React from 'react';
import { Typography, Steps, Card, Button, Divider, Alert, Row, Col } from 'antd';
import { 
    UserAddOutlined, 
    DashboardOutlined, 
    CommentOutlined, 
    ClusterOutlined, 
    RobotOutlined, 
    TrophyOutlined,
    RightOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

function LearningGuide() {
    
    // Nội dung các bước học tập
    const guideSteps = [
        {
            title: 'Bước 1: Tạo tài khoản & Đăng nhập',
            icon: <UserAddOutlined />,
            description: (
                <div>
                    <Text>Đầu tiên, bạn cần có một tài khoản để hệ thống lưu lại tiến độ học tập.</Text>
                    <ul style={{paddingLeft: 20, marginTop: 5}}>
                        <li>Dữ liệu lịch sử chat được lưu trữ bảo mật.</li>
                        <li>Theo dõi sự tiến bộ qua từng ngày.</li>
                    </ul>
                </div>
            )
        },
        {
            title: 'Bước 2: Xác định trình độ (Tùy chọn)',
            icon: <DashboardOutlined />,
            description: 'Nếu bạn chưa biết bắt đầu từ đâu, hãy thử làm bài kiểm tra đầu vào (sắp ra mắt) hoặc bắt đầu với các bài hội thoại cấp độ A1 (Sơ cấp).'
        },
        {
            title: 'Bước 3: Luyện Hội Thoại (Roleplay)',
            icon: <CommentOutlined />,
            status: 'process', // Đang thực hiện
            description: (
                <div>
                    <Text strong>Đây là tính năng cốt lõi!</Text>
                    <p>Vào mục <b>Luyện hội thoại</b>, chọn một chủ đề yêu thích (VD: Du lịch).</p>
                    <p>AI sẽ đóng vai nhân viên khách sạn/người bán hàng... bạn sẽ đóng vai khách. Hãy bật Mic và nói chuyện như ngoài đời thực.</p>
                </div>
            )
        },
        {
            title: 'Bước 4: Củng cố Từ vựng (Mindmap)',
            icon: <ClusterOutlined />,
            description: 'Gặp từ mới khó nhớ? Vào mục Từ vựng Mindmap. Hệ thống sẽ vẽ sơ đồ tư duy, giúp bạn liên kết từ đó với các từ đồng nghĩa/trái nghĩa để nhớ sâu hơn.'
        },
        {
            title: 'Bước 5: Luyện phản xạ tự do (Chat AI)',
            icon: <RobotOutlined />,
            description: 'Khi đã tự tin hơn, hãy vào Chat AI. Tại đây không có kịch bản trước, bạn có thể "tám" chuyện trên trời dưới biển với AI để tăng khả năng phản xạ.'
        },
        {
            title: 'Bước 6: Theo dõi & Nâng cấp',
            icon: <TrophyOutlined />,
            description: 'Vào Hồ sơ cá nhân để xem lại lịch sử các bài đã học. Nếu muốn mở khóa tính năng cao cấp, hãy cân nhắc nâng cấp gói PRO.'
        },
    ];

    return (
        <div className="learning-guide-page" style={{ background: '#f0f2f5', minHeight: '100vh', padding: '40px 20px' }}>
            <div className="container" style={{ maxWidth: 1000, margin: '0 auto' }}>
                
                {/* 1. HEADER */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Title level={1} style={{ color: '#0075F3' }}>Lộ Trình Học Tập Hiệu Quả</Title>
                    <Paragraph style={{ fontSize: 18, color: '#666' }}>
                        Chào mừng bạn đến với English AI. Dưới đây là hướng dẫn từng bước để bạn khai thác tối đa sức mạnh của công nghệ AI.
                    </Paragraph>
                </div>

                <Row gutter={[24, 24]}>
                    {/* CỘT TRÁI: CÁC BƯỚC (STEPS) */}
                    <Col xs={24} lg={16}>
                        <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <Steps 
                                direction="vertical" 
                                current={-1} // Không highlight bước nào cụ thể
                                items={guideSteps.map(item => ({
                                    title: <Title level={4} style={{margin: 0}}>{item.title}</Title>,
                                    icon: item.icon,
                                    description: <div style={{marginTop: 10, fontSize: 15}}>{item.description}</div>,
                                    status: item.status || 'wait'
                                }))} 
                            />
                        </Card>
                    </Col>

                    {/* CỘT PHẢI: MẸO & CTA */}
                    <Col xs={24} lg={8}>
                        {/* Box Mẹo học tập */}
                        <Card title="💡 Mẹo nhỏ cho bạn" style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <Alert
                                message="Đừng sợ sai!"
                                description="AI của chúng tôi được thiết kế để khuyến khích bạn nói. Sai ngữ pháp cũng không sao, quan trọng là bạn dám mở lời."
                                type="success"
                                showIcon
                                style={{ marginBottom: 15 }}
                            />
                            <Alert
                                message="Học đều đặn"
                                description="Mỗi ngày chỉ cần 15 phút luyện hội thoại sẽ hiệu quả hơn học nhồi nhét 2 tiếng cuối tuần."
                                type="info"
                                showIcon
                            />
                        </Card>

                        {/* Box Kêu gọi hành động */}
                        <Card style={{ borderRadius: 12, textAlign: 'center', background: 'linear-gradient(135deg, #0075F3 0%, #00c6ff 100%)', color: 'white', border: 'none' }}>
                            <Title level={3} style={{ color: 'white' }}>Sẵn sàng chưa?</Title>
                            <Paragraph style={{ color: 'rgba(255,255,255,0.9)' }}>
                                Bắt đầu bài học đầu tiên ngay hôm nay!
                            </Paragraph>
                            <Link to="/conversation">
                                <Button size="large" style={{ color: '#0075F3', fontWeight: 'bold', height: 45, borderRadius: 25 }}>
                                    Học ngay thôi <RightOutlined />
                                </Button>
                            </Link>
                        </Card>
                    </Col>
                </Row>

            </div>
        </div>
    );
}

export default LearningGuide;