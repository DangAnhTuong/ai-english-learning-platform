import React, { useState } from 'react';
import { Collapse, Typography, Input, Button, Tag, Row, Col } from 'antd';
import { CaretRightOutlined, SearchOutlined, QuestionCircleFilled, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

function FAQ() {
  const navigate = useNavigate();
  const [searchWord, setSearchWord] = useState('');

  const faqData = [
    {
      category: "Về English AI & Công Nghệ Luyện Nói",
      questions: [
        {
          q: "English AI là gì và khác gì so với trung tâm truyền thống?",
          a: "English AI là nền tảng học tiếng Anh trực tuyến ứng dụng công nghệ mô phỏng hội thoại AI 1:1. Điểm khác biệt lớn nhất là bạn có thể luyện nói bất kỳ lúc nào, nói sai không sợ ngại, và được AI phân tích chính xác từng âm vị phát âm cũng như ngữ điệu theo thời gian thực."
        },
        {
          q: "Tôi mất gốc hoàn toàn thì có học được không?",
          a: "Hoàn toàn phù hợp! Chúng tôi có lộ trình chuyên biệt từ A1 với khóa 'Phản Xạ Giao Tiếp AI 30 Ngày' và 'Luyện Phát Âm Chuẩn Mỹ IPA'. Mỗi câu hội thoại đều có phiên âm, bản dịch tiếng Việt và hướng dẫn khẩu hình chi tiết."
        },
        {
          q: "Hệ thống AI sửa lỗi phát âm và ngữ pháp như thế nào?",
          a: "Hệ thống sử dụng mô hình nhận diện giọng nói Deepgram STT kết hợp thuật toán tính khoảng cách ngữ âm Levenshtein để đo độ chuẩn xác từng âm tiết, đồng thời phân tích ngữ pháp ngữ cảnh qua OpenAI GPT-4o."
        }
      ]
    },
    {
      category: "Gói Học & Kích Hoạt Tự Động",
      questions: [
        {
          q: "Làm thế nào để nâng cấp gói VIP Pro?",
          a: "Bạn chỉ cần nhấn vào nút '👑 Gói VIP' trên thanh Menu hoặc truy cập trang thanh toán /payment. Chọn gói phù hợp (1 tháng, 3 tháng hoặc 1 năm), quét mã VietQR ngân hàng MB Bank. Hệ thống SePay sẽ tự động kích hoạt tài khoản trong vòng 3-5 giây."
        },
        {
          q: "Tôi có được hoàn tiền nếu không hài lòng không?",
          a: "Chắc chắn rồi. Chúng tôi cam kết chính sách hoàn tiền 100% trong vòng 3 ngày đầu tiên nếu bạn gặp lỗi kỹ thuật mà đội ngũ hỗ trợ không khắc phục được."
        }
      ]
    },
    {
      category: "Thiết Bị & Kỹ Thuật",
      questions: [
        {
          q: "Micro của tôi không nhận âm thanh thì xử lý thế nào?",
          a: "Vui lòng bấm vào biểu tượng ổ khóa bên trái thanh địa chỉ trình duyệt, chọn 'Cho phép Microphone'. Hãy đảm bảo trình duyệt (Chrome, Safari, Edge) được cấp quyền thu âm trong cài đặt hệ điều hành."
        },
        {
          q: "Tôi có thể học trên điện thoại hoặc máy tính bảng không?",
          a: "Hoàn toàn được. Website được tối ưu 100% responsive chuẩn web app trên cả iPhone, iPad và điện thoại Android."
        }
      ]
    }
  ];

  return (
    <div className="faq-page" style={{ background: '#f8fafc', minHeight: 'calc(100vh - 74px)', padding: '50px 24px 80px' }}>
      <div className="container" style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#e0f2fe',
            color: '#0369a1',
            padding: '6px 16px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 800,
            marginBottom: 12
          }}>
            <ThunderboltOutlined style={{ marginRight: 6 }} /> TRUNG TÂM TRỢ GIÚP & HỖ TRỢ
          </div>
          <Title level={1} style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>
            Câu Hỏi Thường Gặp (FAQ)
          </Title>
          <Paragraph style={{ fontSize: 16, color: '#64748b', maxWidth: 540, margin: '0 auto 24px' }}>
            Mọi thông tin bạn cần về lộ trình học tập, công nghệ AI và chính sách bảo vệ học viên.
          </Paragraph>

          <Input
            size="large"
            placeholder="Tìm kiếm câu hỏi thắc mắc của bạn..."
            prefix={<SearchOutlined style={{ color: '#0072ff' }} />}
            value={searchWord}
            onChange={e => setSearchWord(e.target.value)}
            style={{ maxWidth: 540, borderRadius: 16, height: 48, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}
            allowClear
          />
        </div>

        {faqData.map((section, idx) => {
          const filteredQuestions = section.questions.filter(item =>
            item.q.toLowerCase().includes(searchWord.toLowerCase()) ||
            item.a.toLowerCase().includes(searchWord.toLowerCase())
          );

          if (filteredQuestions.length === 0) return null;

          return (
            <div key={idx} style={{ marginBottom: 36 }}>
              <Title level={4} style={{ color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 4, height: 18, background: '#0072ff', borderRadius: 2 }}></span>
                {section.category}
              </Title>

              <Collapse
                bordered={false}
                expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} style={{ color: '#0072ff' }} />}
                style={{ background: 'transparent' }}
              >
                {filteredQuestions.map((item, index) => (
                  <Panel
                    header={<span style={{ fontWeight: 700, fontSize: 15.5, color: '#1e293b' }}>{item.q}</span>}
                    key={idx + '-' + index}
                    style={{
                      background: '#fff',
                      borderRadius: 16,
                      marginBottom: 12,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                      padding: '4px 8px'
                    }}
                  >
                    <Paragraph style={{ color: '#475569', lineHeight: 1.7, margin: 0, fontSize: 14.5 }}>
                      {item.a}
                    </Paragraph>
                  </Panel>
                ))}
              </Collapse>
            </div>
          );
        })}

        <div style={{
          background: 'linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)',
          borderRadius: 24,
          padding: '36px 30px',
          textAlign: 'center',
          color: '#fff',
          marginTop: 50,
          boxShadow: '0 12px 30px rgba(0, 114, 255, 0.3)'
        }}>
          <Title level={3} style={{ color: '#fff', margin: 0 }}>Vẫn Còn Câu Hỏi Cần Giải Đáp?</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.9)', margin: '8px auto 20px', maxWidth: 480 }}>
            Đội ngũ chuyên viên sư phạm & kỹ thuật của chúng tôi sẵn sàng hỗ trợ bạn 24/7.
          </Paragraph>
          <Button
            size="large"
            shape="round"
            style={{ background: '#fff', color: '#0072ff', fontWeight: 800, height: 46, padding: '0 28px' }}
            onClick={() => navigate('/contact')}
          >
            Liên Hệ Hỗ Trợ Ngay
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FAQ;
