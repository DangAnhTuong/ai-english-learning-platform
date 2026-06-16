import React from 'react';
import { Typography, Divider, List, Button } from 'antd';
import { SafetyCertificateOutlined, HistoryOutlined, StopOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

function RefundPolicy() {
    const navigate = useNavigate();

    return (
        <div className="refund-page" style={{ padding: '60px 20px', background: '#fff', maxWidth: 1000, margin: '0 auto' }}>
            
            {/* HEADER */}
            <div style={{ textAlign: 'center', marginBottom: 50 }}>
                <SafetyCertificateOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 20 }} />
                <Title level={1} style={{ color: '#0075F3' }}>Chính Sách Hoàn Tiền</Title>
                <Paragraph style={{ fontSize: 16 }}>
                    English AI cam kết mang lại trải nghiệm học tập tốt nhất. Tuy nhiên, chúng tôi hiểu rằng đôi khi mọi thứ không diễn ra như mong đợi.
                </Paragraph>
            </div>

            {/* NỘI DUNG CHÍNH */}
            <div className="policy-content">
                {/* 1. ĐIỀU KIỆN HOÀN TIỀN */}
                <Title level={3}><HistoryOutlined /> 1. Thời gian & Điều kiện áp dụng</Title>
                <Paragraph>
                    Học viên có quyền yêu cầu hoàn tiền trong vòng <Text strong>03 ngày</Text> kể từ thời điểm thanh toán thành công nếu thỏa mãn một trong các điều kiện sau:
                </Paragraph>
                <List
                    bordered
                    dataSource={[
                        'Lỗi kỹ thuật nghiêm trọng từ hệ thống khiến học viên không thể truy cập bài học (đã báo hỗ trợ nhưng không khắc phục được).',
                        'Thanh toán bị trùng lặp (bị trừ tiền 2 lần cho 1 giao dịch).',
                        'Sản phẩm thực tế khác biệt hoàn toàn so với mô tả trên website.'
                    ]}
                    renderItem={item => <List.Item>• {item}</List.Item>}
                    style={{ marginBottom: 30 }}
                />

                {/* 2. TRƯỜNG HỢP KHÔNG HOÀN TIỀN */}
                <Title level={3}><StopOutlined /> 2. Trường hợp KHÔNG được hoàn tiền</Title>
                <Paragraph>
                    Để đảm bảo tính công bằng, chúng tôi từ chối yêu cầu hoàn tiền trong các trường hợp:
                </Paragraph>
                <List
                    bordered
                    dataSource={[
                        'Yêu cầu gửi quá thời hạn 03 ngày kể từ ngày mua.',
                        'Lý do chủ quan: "Không thích nữa", "Không có thời gian học", "Mua nhầm".',
                        'Học viên đã sử dụng quá 20% nội dung khóa học hoặc đã tải xuống tài liệu.',
                        'Tài khoản vi phạm điều khoản sử dụng (chia sẻ tài khoản, hack, cheat...).'
                    ]}
                    renderItem={item => <List.Item>• {item}</List.Item>}
                    style={{ marginBottom: 30 }}
                />

                {/* 3. QUY TRÌNH XỬ LÝ */}
                <Title level={3}><MailOutlined /> 3. Quy trình xử lý hoàn tiền</Title>
                <Paragraph>
                    <Text strong>Bước 1:</Text> Gửi yêu cầu qua trang Liên hệ hoặc Email <Text code>letrithieng@gmail.com</Text> với nội dung: 
                    <br/>- Tiêu đề: "Yêu cầu hoàn tiền - [Mã đơn hàng/Email đăng ký]"
                    <br/>- Lý do chi tiết + Hình ảnh minh họa lỗi (nếu có).
                </Paragraph>
                <Paragraph>
                    <Text strong>Bước 2:</Text> English AI sẽ thẩm định yêu cầu trong vòng <Text strong>24-48 giờ</Text> làm việc.
                </Paragraph>
                <Paragraph>
                    <Text strong>Bước 3:</Text> Nếu yêu cầu hợp lệ, tiền sẽ được hoàn về tài khoản thanh toán ban đầu trong vòng <Text strong>5-7 ngày</Text> làm việc (tùy ngân hàng).
                </Paragraph>

                <Divider />

                {/* FOOTER ACTION */}
                <div style={{ textAlign: 'center', marginTop: 40, background: '#f9f9f9', padding: 30, borderRadius: 10 }}>
                    <Title level={4}>Bạn cần hỗ trợ thêm?</Title>
                    <Paragraph>Đội ngũ CSKH của chúng tôi luôn sẵn sàng lắng nghe.</Paragraph>
                    <Button type="primary" onClick={() => navigate('/contact')}>
                        Liên hệ bộ phận Hỗ trợ
                    </Button>
                </div>

            </div>
        </div>
    );
}

export default RefundPolicy;