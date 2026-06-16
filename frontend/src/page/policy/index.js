import React from 'react';
import { Typography, Divider, Alert, Row, Col } from 'antd';
import { 
    LockOutlined, 
    SafetyCertificateOutlined, 
    DatabaseOutlined, 
    GlobalOutlined,
    CustomerServiceOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

function PrivacyPolicy() {
    return (
        <div className="policy-page" style={{ padding: '60px 20px', background: '#fff', color: '#333' }}>
            <div className="container" style={{ maxWidth: 900, margin: '0 auto' }}>
                
                {/* HEADER */}
                <div style={{ textAlign: 'center', marginBottom: 50 }}>
                    <LockOutlined style={{ fontSize: 50, color: '#0075F3', marginBottom: 20 }} />
                    <Title level={1} style={{ color: '#0075F3' }}>Chính Sách Bảo Mật</Title>
                    <Text type="secondary" style={{ fontSize: 16 }}>
                        Cập nhật lần cuối: Ngày 22 tháng 12 năm 2025
                    </Text>
                </div>

                {/* TÓM TẮT CAM KẾT */}
                <Alert
                    message="Cam Kết Của English AI"
                    description="Chúng tôi coi trọng quyền riêng tư của bạn. Dữ liệu giọng nói và lịch sử hội thoại của bạn được mã hóa và chỉ được sử dụng cho mục đích cải thiện trải nghiệm học tập."
                    type="info"
                    showIcon
                    style={{ marginBottom: 40, borderRadius: 8, padding: 20 }}
                />

                <div className="policy-content">
                    
                    {/* 1. THU THẬP THÔNG TIN */}
                    <div style={{ marginBottom: 30 }}>
                        <Title level={3}><DatabaseOutlined /> 1. Thông tin chúng tôi thu thập</Title>
                        <Paragraph>Để cung cấp dịch vụ tốt nhất, chúng tôi thu thập các loại thông tin sau:</Paragraph>
                        <ul>
                            <li><Text strong>Thông tin cá nhân:</Text> Họ tên, email, ảnh đại diện (khi bạn đăng ký hoặc đăng nhập qua Google/Facebook).</li>
                            <li><Text strong>Dữ liệu học tập:</Text> Lịch sử các bài hội thoại, từ vựng đã lưu, điểm số phát âm và tiến độ khóa học.</li>
                            <li><Text strong>Dữ liệu giọng nói (Voice Data):</Text> Các đoạn ghi âm ngắn khi bạn sử dụng tính năng luyện nói. Những dữ liệu này được xử lý bởi AI để chấm điểm và không được lưu trữ vĩnh viễn nếu không cần thiết.</li>
                        </ul>
                    </div>

                    {/* 2. SỬ DỤNG THÔNG TIN */}
                    <div style={{ marginBottom: 30 }}>
                        <Title level={3}><SafetyCertificateOutlined /> 2. Cách chúng tôi sử dụng thông tin</Title>
                        <Paragraph>Chúng tôi sử dụng dữ liệu của bạn cho các mục đích:</Paragraph>
                        <ul>
                            <li>Cung cấp và duy trì dịch vụ học tiếng Anh.</li>
                            <li>Cá nhân hóa lộ trình học dựa trên trình độ của bạn.</li>
                            <li>Cải thiện thuật toán AI nhận diện giọng nói (dữ liệu được ẩn danh).</li>
                            <li>Gửi thông báo về bài học mới hoặc các thay đổi trong chính sách.</li>
                        </ul>
                    </div>

                    {/* 3. CHIA SẺ THÔNG TIN */}
                    <div style={{ marginBottom: 30 }}>
                        <Title level={3}><GlobalOutlined /> 3. Chia sẻ thông tin với bên thứ ba</Title>
                        <Paragraph>
                            <Text strong>Chúng tôi CAM KẾT KHÔNG BÁN dữ liệu cá nhân của bạn.</Text> Tuy nhiên, chúng tôi có thể chia sẻ dữ liệu với các đối tác tin cậy sau để vận hành hệ thống:
                        </Paragraph>
                        <ul>
                            <li><Text strong>Nhà cung cấp dịch vụ AI:</Text> (Ví dụ: OpenAI, Google Cloud) để xử lý ngôn ngữ tự nhiên và chuyển đổi văn bản/giọng nói.</li>
                            <li><Text strong>Cổng thanh toán:</Text> Để xử lý các giao dịch nâng cấp gói Premium (chúng tôi không lưu thông tin thẻ tín dụng của bạn).</li>
                        </ul>
                    </div>

                    {/* 4. COOKIES */}
                    <div style={{ marginBottom: 30 }}>
                        <Title level={3}>4. Cookies và Công nghệ theo dõi</Title>
                        <Paragraph>
                            Website sử dụng Cookies để ghi nhớ trạng thái đăng nhập và tùy chọn ngôn ngữ của bạn. Bạn có thể tắt Cookies trong cài đặt trình duyệt, nhưng điều này có thể ảnh hưởng đến trải nghiệm sử dụng.
                        </Paragraph>
                    </div>

                    {/* 5. QUYỀN LỢI NGƯỜI DÙNG */}
                    <div style={{ marginBottom: 30 }}>
                        <Title level={3}>5. Quyền lợi của bạn</Title>
                        <Paragraph>Bạn có toàn quyền đối với dữ liệu của mình:</Paragraph>
                        <ul>
                            <li>Yêu cầu xem lại hoặc chỉnh sửa thông tin cá nhân.</li>
                            <li>Yêu cầu xóa tài khoản và toàn bộ dữ liệu học tập vĩnh viễn.</li>
                            <li>Từ chối nhận email quảng cáo bất cứ lúc nào.</li>
                        </ul>
                    </div>
                </div>

                <Divider />

                {/* LIÊN HỆ */}
                <div style={{ marginTop: 40 }}>
                    <Title level={4}><CustomerServiceOutlined /> Thông tin liên hệ về quyền riêng tư</Title>
                    <Paragraph>
                        Nếu bạn có bất kỳ câu hỏi nào về Chính sách bảo mật này, vui lòng liên hệ với chúng tôi qua:
                    </Paragraph>
                    <Paragraph>
                        <Text strong>Email:</Text> <a href="mailto:letrithieng@gmail.com">letrithieng@gmail.com</a><br />
                        <Text strong>Địa chỉ:</Text> Tòa nhà English AI, Đặng Thùy Trâm, Phường 13, Quận Bình Thạnh, TP. Hồ Chí Minh.
                    </Paragraph>
                </div>

            </div>
        </div>
    );
}

export default PrivacyPolicy;