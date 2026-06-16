import React from 'react';
import { Typography, Divider, List } from 'antd';
import { 
    FileProtectOutlined, 
    UserSwitchOutlined, 
    CopyrightOutlined, 
    CreditCardOutlined, 
    WarningOutlined 
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

function TermsOfService() {
    return (
        <div className="terms-page" style={{ padding: '60px 20px', background: '#fff', color: '#333' }}>
            <div className="container" style={{ maxWidth: 900, margin: '0 auto' }}>
                
                {/* HEADER */}
                <div style={{ textAlign: 'center', marginBottom: 50 }}>
                    <FileProtectOutlined style={{ fontSize: 50, color: '#faad14', marginBottom: 20 }} />
                    <Title level={1} style={{ color: '#0075F3' }}>Điều Khoản Dịch Vụ</Title>
                    <Text type="secondary" style={{ fontSize: 16 }}>
                        Có hiệu lực từ: Ngày 01 tháng 01 năm 2025
                    </Text>
                </div>

                <div className="terms-content">
                    <Paragraph strong style={{ fontSize: 16 }}>
                        Chào mừng bạn đến với English AI. Khi truy cập và sử dụng website này, bạn đồng ý tuân thủ các điều khoản dưới đây. Vui lòng đọc kỹ trước khi bắt đầu.
                    </Paragraph>

                    <Divider />

                    {/* 1. TÀI KHOẢN NGƯỜI DÙNG */}
                    <div style={{ marginBottom: 30 }}>
                        <Title level={3}><UserSwitchOutlined /> 1. Tài khoản người dùng</Title>
                        <List
                            dataSource={[
                                'Bạn chịu trách nhiệm bảo mật thông tin đăng nhập (email, mật khẩu). English AI không chịu trách nhiệm cho bất kỳ tổn thất nào do việc bạn để lộ thông tin tài khoản.',
                                'Mỗi tài khoản chỉ được sử dụng bởi một cá nhân duy nhất. Nghiêm cấm hành vi chia sẻ tài khoản cho nhiều người sử dụng chung.',
                                'Bạn phải cam kết cung cấp thông tin đăng ký chính xác và cập nhật.'
                            ]}
                            renderItem={item => <List.Item style={{border: 'none', padding: '5px 0'}}>• {item}</List.Item>}
                        />
                    </div>

                    {/* 2. QUYỀN SỞ HỮU TRÍ TUỆ */}
                    <div style={{ marginBottom: 30 }}>
                        <Title level={3}><CopyrightOutlined /> 2. Quyền sở hữu trí tuệ</Title>
                        <Paragraph>
                            Toàn bộ nội dung trên website bao gồm: Bài giảng, Video, Mã nguồn, Giao diện, Logo và Dữ liệu từ vựng đều thuộc sở hữu độc quyền của <Text strong>English AI</Text>.
                        </Paragraph>
                        <Paragraph>
                            <Text type="danger">Nghiêm cấm:</Text> Sao chép, quay màn hình, phát tán lại nội dung khóa học lên các nền tảng khác (Youtube, Facebook, Drive...) dưới mọi hình thức khi chưa có sự đồng ý bằng văn bản của chúng tôi.
                        </Paragraph>
                    </div>

                    {/* 3. THANH TOÁN & GIA HẠN */}
                    <div style={{ marginBottom: 30 }}>
                        <Title level={3}><CreditCardOutlined /> 3. Thanh toán và Dịch vụ Premium</Title>
                        <List
                            dataSource={[
                                'Các gói cước Premium được thanh toán trả trước một lần (1 tháng, 6 tháng hoặc 1 năm).',
                                'Giá cước có thể thay đổi tùy theo chương trình khuyến mãi, nhưng sẽ không ảnh hưởng đến các gói bạn đã thanh toán trước đó.',
                                'Chính sách hoàn tiền được quy định rõ tại trang "Chính sách hoàn tiền". Vui lòng tham khảo kỹ trước khi mua.'
                            ]}
                            renderItem={item => <List.Item style={{border: 'none', padding: '5px 0'}}>• {item}</List.Item>}
                        />
                    </div>

                    {/* 4. HÀNH VI CẤM */}
                    <div style={{ marginBottom: 30 }}>
                        <Title level={3}><WarningOutlined /> 4. Các hành vi bị nghiêm cấm</Title>
                        <Paragraph>Chúng tôi có quyền khóa tài khoản vĩnh viễn mà không cần báo trước nếu phát hiện:</Paragraph>
                        <List
                            dataSource={[
                                'Sử dụng ngôn từ thô tục, xúc phạm, quấy rối AI hoặc người dùng khác trong hệ thống Chat.',
                                'Sử dụng phần mềm thứ 3 (tool, bot) để can thiệp vào hệ thống.',
                                'Cố tình tấn công, phá hoại hoặc làm quá tải máy chủ của English AI.'
                            ]}
                            renderItem={item => <List.Item style={{border: 'none', padding: '5px 0'}}>• {item}</List.Item>}
                        />
                    </div>

                    {/* 5. MIỄN TRỪ TRÁCH NHIỆM */}
                    <div style={{ marginBottom: 30 }}>
                        <Title level={3}>5. Miễn trừ trách nhiệm</Title>
                        <Paragraph>
                            English AI cung cấp công cụ hỗ trợ học tập, nhưng chúng tôi không cam kết đảm bảo 100% bạn sẽ nói trôi chảy hay đạt điểm thi cụ thể nào đó. Kết quả học tập phụ thuộc vào sự nỗ lực và kiên trì của chính bạn.
                        </Paragraph>
                    </div>

                </div>

                <Divider />

                {/* LIÊN HỆ */}
                <div style={{ marginTop: 40 }}>
                    <Title level={4}>Thắc mắc về điều khoản?</Title>
                    <Paragraph>
                        Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ: <br />
                        <Text strong>Email:</Text> <a href="mailto:letrithieng@gmail.com">letrithieng@gmail.com</a>
                    </Paragraph>
                </div>

            </div>
        </div>
    );
}

export default TermsOfService;