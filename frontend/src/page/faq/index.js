import React from 'react';
import { Collapse, Typography, Input, Button } from 'antd';
import { CaretRightOutlined, SearchOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;
const { Panel } = Collapse;

function FAQ() {
    // Dữ liệu câu hỏi mẫu
    const navigate = useNavigate();
    const faqData = [
        {
            category: "Về English AI",
            questions: [
                {
                    q: "English AI là gì?",
                    a: "English AI là nền tảng học tiếng Anh trực tuyến sử dụng trí tuệ nhân tạo để giúp bạn luyện tập hội thoại 1-1, học từ vựng qua sơ đồ tư duy (Mindmap) và sửa lỗi ngữ pháp tức thì."
                },
                {
                    q: "Tôi có cần trả phí để sử dụng không?",
                    a: "Bạn có thể đăng ký tài khoản miễn phí để trải nghiệm các tính năng cơ bản. Để mở khóa toàn bộ bài học và luyện nói không giới hạn, bạn cần nâng cấp lên gói Premium."
                }
            ]
        },
        {
            category: "Học tập & Kỹ thuật",
            questions: [
                {
                    q: "AI có thể sửa lỗi phát âm của tôi không?",
                    a: "Có. Hệ thống sử dụng công nghệ nhận diện giọng nói tiên tiến để so sánh phát âm của bạn với người bản xứ và đưa ra gợi ý chỉnh sửa."
                },
                {
                    q: "Tại sao Micro của tôi không hoạt động?",
                    a: "Vui lòng kiểm tra xem bạn đã cấp quyền truy cập Micro cho trình duyệt chưa. Hãy thử tải lại trang (F5) hoặc kiểm tra cài đặt âm thanh trên thiết bị."
                }
            ]
        },
        {
            category: "Tài khoản & Thanh toán",
            questions: [
                {
                    q: "Làm thế nào để nâng cấp gói VIP?",
                    a: "Bạn có thể vào mục 'Hồ sơ cá nhân' -> chọn tab 'Gói cước' hoặc bấm vào nút 'Mua gói' trên trang chủ để xem bảng giá và thanh toán."
                },
                {
                    q: "Chính sách hoàn tiền như thế nào?",
                    a: "Chúng tôi hỗ trợ hoàn tiền trong vòng 3 ngày đầu tiên nếu bạn gặp lỗi kỹ thuật nghiêm trọng mà đội ngũ hỗ trợ không thể khắc phục được."
                }
            ]
        }
    ];

    return (
        <div className="faq-page" style={{ background: '#f0f2f5', minHeight: '100vh', padding: '40px 20px' }}>
            <div className="container" style={{ maxWidth: 800, margin: '0 auto' }}>

                {/* Header trang */}
                <div style={{ textAlign: 'center', marginBottom: 50 }}>
                    <Title level={1} style={{ color: '#0075F3' }}>Câu Hỏi Thường Gặp</Title>
                    <Paragraph style={{ fontSize: 16, color: '#666' }}>
                        Chúng tôi ở đây để giải đáp mọi thắc mắc của bạn.
                    </Paragraph>

                    {/* Thanh tìm kiếm (Giả lập) */}
                    <Input
                        size="large"
                        placeholder="Bạn đang tìm kiếm gì...?"
                        prefix={<SearchOutlined />}
                        style={{ maxWidth: 500, borderRadius: 20, marginTop: 20, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}
                    />
                </div>

                {/* Danh sách FAQ */}
                {faqData.map((section, idx) => (
                    <div key={idx} style={{ marginBottom: 30 }}>
                        <Title level={4} style={{ marginLeft: 10, borderLeft: '4px solid #0075F3', paddingLeft: 10, marginBottom: 15 }}>
                            {section.category}
                        </Title>
                        <Collapse
                            bordered={false}
                            expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
                            style={{ background: 'transparent' }}
                        >
                            {section.questions.map((item, index) => (
                                <Panel
                                    header={<span style={{ fontWeight: 600, fontSize: 16 }}>{item.q}</span>}
                                    key={idx + '-' + index}
                                    style={{
                                        background: '#fff',
                                        borderRadius: 8,
                                        marginBottom: 10,
                                        border: 'none',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    <p style={{ color: '#555', lineHeight: 1.6, margin: 0 }}>{item.a}</p>
                                </Panel>
                            ))}
                        </Collapse>
                    </div>
                ))}

                {/* Box liên hệ nếu không tìm thấy câu trả lời */}
                <div style={{ textAlign: 'center', marginTop: 60, background: '#fff', padding: 40, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <QuestionCircleOutlined style={{ fontSize: 40, color: '#faad14', marginBottom: 15 }} />
                    <Title level={4} style={{ margin: '10px 0' }}>Vẫn còn thắc mắc?</Title>
                    <Paragraph>Nếu bạn không tìm thấy câu trả lời, hãy liên hệ trực tiếp với đội ngũ hỗ trợ.</Paragraph>
                    <Button
                        type="primary"
                        shape="round"
                        size="large"
                        onClick={() => navigate('/contact')} // <-- Chuyển hướng sang trang Liên hệ vừa tạo
                    >
                        Liên hệ ngay
                    </Button>
                </div>

            </div>
        </div>
    );
}

export default FAQ;