import React, { useState, useMemo } from 'react';
import {
  Row, Col, Card, Button, Input, Select, Tag, Modal,
  Typography, Space, Tooltip, Empty, Badge
} from 'antd';
import {
  SearchOutlined, PlayCircleOutlined, BookOutlined,
  UserOutlined, StarFilled, ClockCircleOutlined,
  CheckCircleFilled, FireFilled, ArrowRightOutlined,
  SoundOutlined, TrophyOutlined, ThunderboltOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './style.css';

const { Title, Text, Paragraph } = Typography;

const COURSES_DATA = [
  {
    id: 'ai-comm-30d',
    title: 'Phản Xạ Giao Tiếp AI 30 Ngày',
    tagline: 'Xóa bỏ rào cản sợ nói, tự tin giao tiếp mọi tình huống đời sống',
    level: 'Beginner - A2',
    levelTag: 'A1 - B1',
    category: 'speaking',
    categoryName: 'Giao tiếp bản xứ',
    rating: 4.9,
    reviews: 1420,
    students: 5280,
    duration: '30 ngày • 60 giờ học',
    lessonsCount: 30,
    badge: '🔥 Phổ biến nhất',
    badgeColor: '#ff4d4f',
    gradient: 'linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)',
    icon: '🗣️',
    topicParam: 'daily_life',
    overview: 'Khóa học được thiết kế đặc biệt cho người sợ giao tiếp. Bạn sẽ tương tác 1:1 với gia sư AI mỗi ngày, luyện nói qua các kịch bản thực tế từ chào hỏi, kết bạn, đi siêu thị đến xử lý tình huống khẩn cấp.',
    syllabus: [
      { unit: 'Tuần 1', title: 'Khởi động & Phá băng sự ngượng ngùng', desc: 'Chào hỏi, giới thiệu bản thân ấn tượng, small talk về thời tiết và sở thích.' },
      { unit: 'Tuần 2', title: 'Sinh hoạt & Tương tác thực tế', desc: 'Order cà phê, gọi món nhà hàng, mua sắm đồ đạc, hỏi đường và chỉ dẫn.' },
      { unit: 'Tuần 3', title: 'Mở rộng câu chuyện & Bày tỏ ý kiến', desc: 'Kể về kỳ nghỉ, chia sẻ kế hoạch tương lai, đồng ý hoặc từ chối lịch sự.' },
      { unit: 'Tuần 4', title: 'Xử lý tình huống & Tự tin bứt phá', desc: 'Khiếu nại sản phẩm, đàm phán giá cả, giao tiếp tự nhiên không cần dịch thầm.' }
    ]
  },
  {
    id: 'ipa-mastery',
    title: 'Luyện Phát Âm Chuẩn Mỹ IPA & Ngữ Điệu',
    tagline: 'Làm chủ 44 âm quốc tế, nối âm, nuốt âm và ngữ điệu tự nhiên như người bản xứ',
    level: 'Beginner - Mất gốc',
    levelTag: 'A1 - A2',
    category: 'pronunciation',
    categoryName: 'Phát âm & Ngữ điệu',
    rating: 4.9,
    reviews: 980,
    students: 3950,
    duration: '24 bài học • 35 giờ',
    lessonsCount: 24,
    badge: '🎙️ Độc quyền AI',
    badgeColor: '#10b981',
    gradient: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
    icon: '🎙️',
    topicParam: 'education',
    overview: 'Khóa học ứng dụng công nghệ phân tích âm thanh AI, chỉ ra chính xác từng âm vị bạn đọc lệch, hướng dẫn vị trí đặt lưỡi và lấy hơi để phát âm chuẩn giọng Bắc Mỹ.',
    syllabus: [
      { unit: 'Phần 1', title: 'Hệ thống nguyên âm đơn & nguyên âm đôi', desc: 'Phân biệt âm dài / ngắn (/i:/ vs /i/, /u:/ vs /u/), triệt tiêu thói quen phát âm sai phổ biến.' },
      { unit: 'Phần 2', title: 'Hệ thống phụ âm khó & âm đuôi (Ending Sounds)', desc: 'Chinh phục triệt để các âm khó: /θ/, /ð/, /ʃ/, /tʃ/, /dʒ/ và bật âm đuôi chuẩn xác.' },
      { unit: 'Phần 3', title: 'Kỹ thuật nối âm (Linking) & Nuốt âm (Elision)', desc: 'Cách người bản xứ nói nhanh mượt mà bằng quy tắc nối phụ âm - nguyên âm.' },
      { unit: 'Phần 4', title: 'Trọng âm từ, trọng âm câu & Ngữ điệu cảm xúc', desc: 'Nói tiếng Anh có nhạc điệu, nhấn đúng từ khóa truyền tải cảm xúc trọn vẹn.' }
    ]
  },
  {
    id: 'interview-pro',
    title: 'Tiếng Anh Phỏng Vấn Xin Việc (Global Career)',
    tagline: 'Chinh phục nhà tuyển dụng quốc tế với 50 câu hỏi STAR method và mock interview AI',
    level: 'Intermediate - B1/B2',
    levelTag: 'B1 - B2',
    category: 'career',
    categoryName: 'Tiếng Anh công sở',
    rating: 5.0,
    reviews: 840,
    students: 3120,
    duration: '18 bài học • 40 giờ',
    lessonsCount: 18,
    badge: '💼 Top Đánh Giá',
    badgeColor: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    icon: '💼',
    topicParam: 'job_interview',
    overview: 'Luyện tập trả lời phỏng vấn theo mô hình STAR, tối ưu câu trả lời về điểm mạnh/yếu, tình huống xung đột và thương lượng mức lương mong muốn với AI HR Recruiter.',
    syllabus: [
      { unit: 'Chương 1', title: 'Giới thiệu bản thân chuyên nghiệp (Elevator Pitch)', desc: 'Gây ấn tượng trong 60 giây đầu tiên, tóm tắt kinh nghiệm và giá trị cốt lõi.' },
      { unit: 'Chương 2', title: 'Chinh phục câu hỏi hành vi (STAR Method)', desc: 'Cách cấu trúc câu trả lời: Situation, Task, Action, Result tạo độ tin cậy tuyệt đối.' },
      { unit: 'Chương 3', title: 'Xử lý câu hỏi hóc búa & Điểm yếu', desc: 'Biến điểm yếu thành điểm học hỏi, giải thích khoảng trống sự nghiệp một cách khéo léo.' },
      { unit: 'Chương 4', title: 'Đặt câu hỏi ngược lại & Đàm phán đãi ngộ', desc: 'Thể hiện tầm nhìn chiến lược qua các câu hỏi thông minh và kỹ năng deal lương tế nhị.' }
    ]
  },
  {
    id: 'business-master',
    title: 'Tiếng Anh Công Sở & Thuyết Trình Thương Mại',
    tagline: 'Viết email chuyên nghiệp, chủ trì cuộc họp quốc tế và đàm phán hợp đồng',
    level: 'Intermediate - B2',
    levelTag: 'B1 - C1',
    category: 'career',
    categoryName: 'Tiếng Anh công sở',
    rating: 4.8,
    reviews: 620,
    students: 2480,
    duration: '22 bài học • 45 giờ',
    lessonsCount: 22,
    badge: '🏢 Doanh nghiệp',
    badgeColor: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    icon: '📊',
    topicParam: 'business_meeting',
    overview: 'Dành riêng cho nhân sự làm việc tại công ty đa quốc gia hoặc làm việc từ xa với đối tác nước ngoài. Nắm vững thuật ngữ kinh doanh và tác phong giao tiếp chuẩn mực.',
    syllabus: [
      { unit: 'Module 1', title: 'Kỹ năng viết Email thương mại chuẩn quốc tế', desc: 'Văn phong trang trọng, mở đầu và kết thúc sắc bén, follow-up dự án chuyên nghiệp.' },
      { unit: 'Module 2', title: 'Chủ trì & Đóng góp ý kiến trong cuộc họp (Meetings)', desc: 'Cách ngắt lời lịch sự, tóm tắt ý kiến, đưa ra đề xuất và giải quyết bất đồng.' },
      { unit: 'Module 3', title: 'Thuyết trình dự án & Phân tích số liệu (Presentations)', desc: 'Sử dụng ngôn ngữ mô tả biểu đồ, dẫn dắt câu chuyện cuốn hút nhà đầu tư.' },
      { unit: 'Module 4', title: 'Đàm phán thương mại & Chăm sóc khách hàng', desc: 'Kỹ thuật thương lượng đôi bên cùng có lợi (Win-Win) và xử lý khiếu nại khách hàng.' }
    ]
  },
  {
    id: 'ielts-speaking-75',
    title: 'Chiến Lược IELTS Speaking Band 7.5+',
    tagline: 'Luyện 60 chủ đề dự đoán Part 1, 2, 3 với AI Examiner chấm điểm Fluency & Lexical',
    level: 'Advanced - C1',
    levelTag: 'B2 - C1',
    category: 'ielts',
    categoryName: 'Luyện thi IELTS',
    rating: 4.9,
    reviews: 1150,
    students: 4190,
    duration: '36 bài học • 75 giờ',
    lessonsCount: 36,
    badge: '🎯 Luyện Thi VIP',
    badgeColor: '#f59e0b',
    gradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)',
    icon: '🎯',
    topicParam: 'education',
    overview: 'Bộ giải pháp toàn diện cho sĩ tử IELTS: mở rộng từ vựng C1/C2 theo chủ đề, cấu trúc câu phức tự nhiên và phản xạ trả lời câu hỏi Part 3 hóc búa với AI Examiner khó tính.',
    syllabus: [
      { unit: 'Part 1', title: 'Phản xạ nhanh 30 chủ đề thường gặp', desc: 'Kỹ thuật mở rộng câu trả lời (Area technique), tránh trả lời cụt lủn Yes/No.' },
      { unit: 'Part 2', title: 'Làm chủ 2 phút thuyết trình độc thoại', desc: 'Lập dàn ý bằng kỹ thuật PPF (Past - Present - Future) trong 1 phút chuẩn bị.' },
      { unit: 'Part 3', title: 'Tư duy phân tích chiều sâu & Tranh biện', desc: 'Bình luận các vấn đề xã hội, môi trường, công nghệ bằng từ vựng học thuật C1.' },
      { unit: 'Mock Test', title: 'Thi thử 1:1 trọn vẹn với AI Examiner', desc: 'Nhận bảng phân tích điểm chi tiết theo 4 tiêu chí chuẩn IDP / British Council.' }
    ]
  },
  {
    id: 'travel-global',
    title: 'English for Traveling - Tự Tin Khám Phá Thế Giới',
    tagline: 'Hành trang tiếng Anh từ sân bay, khách sạn, ẩm thực đến xử lý sự cố du lịch',
    level: 'Beginner - A2',
    levelTag: 'A2 - B1',
    category: 'travel',
    categoryName: 'Du lịch & Đời sống',
    rating: 4.9,
    reviews: 510,
    students: 2360,
    duration: '16 bài học • 25 giờ',
    lessonsCount: 16,
    badge: '✈️ Du lịch vui',
    badgeColor: '#ec4899',
    gradient: 'linear-gradient(135deg, #db2777 0%, #f472b6 100%)',
    icon: '✈️',
    topicParam: 'travel',
    overview: 'Bạn chuẩn bị du lịch, du học hoặc công tác nước ngoài? Khóa học ngắn gọn, thực dụng này trang bị đầy đủ tất cả mẫu câu phản xạ cần thiết từ lúc check-in sân bay đến khi về nước.',
    syllabus: [
      { unit: 'Chặng 1', title: 'Sân bay, Thủ tục Hải quan & Nhập cảnh', desc: 'Khai báo hải quan, trả lời câu hỏi của nhân viên an ninh, tìm hành lý thất lạc.' },
      { unit: 'Chặng 2', title: 'Khách sạn & Dịch vụ lưu trú', desc: 'Check-in, đổi phòng, yêu cầu dịch vụ phòng và xử lý các vấn đề tiện nghi.' },
      { unit: 'Chặng 3', title: 'Khám phá thành phố & Phương tiện giao thông', desc: 'Mua vé tàu điện ngầm, gọi taxi, hỏi đường và tham quan danh lam thắng cảnh.' },
      { unit: 'Chặng 4', title: 'Ẩm thực, Mua sắm & Xử lý khẩn cấp', desc: 'Thưởng thức ẩm thực địa phương, hoàn thuế mua sắm, liên hệ cảnh sát hoặc bệnh viện.' }
    ]
  },
  {
    id: 'smalltalk-social',
    title: 'Nghệ Thuật Small Talk & Kết Nối Bạn Bè Quốc Tế',
    tagline: 'Bí quyết bắt chuyện tự nhiên, hòa nhập môi trường đa văn hóa và kết bạn',
    level: 'Intermediate - B1',
    levelTag: 'B1 - B2',
    category: 'speaking',
    categoryName: 'Giao tiếp bản xứ',
    rating: 4.8,
    reviews: 430,
    students: 1870,
    duration: '15 bài học • 20 giờ',
    lessonsCount: 15,
    badge: '✨ Tự Nhiên',
    badgeColor: '#6366f1',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)',
    icon: '🎉',
    topicParam: 'friendship',
    overview: 'Học cách bắt đầu cuộc trò chuyện thân mật trong thang máy, buổi tiệc networking, chia sẻ sở thích và tạo dựng mối quan hệ bạn bè quốc tế lâu dài mà không bị gượng gạo.',
    syllabus: [
      { unit: 'Bài 1', title: 'Cách mở lời cuốn hút không gây áp lực', desc: 'Các câu hỏi mở (Open-ended questions), khen ngợi tinh tế về trang phục hoặc không gian.' },
      { unit: 'Bài 2', title: 'Duy trì dòng chảy hội thoại (Active Listening)', desc: 'Kỹ thuật nhắc lại từ khóa, phản hồi cảm xúc (Reactions) chuẩn người bản xứ.' },
      { unit: 'Bài 3', title: 'Kể chuyện ngắn (Storytelling) hấp dẫn', desc: 'Cách chia sẻ một trải nghiệm cá nhân hài hước hoặc đáng nhớ bằng tiếng Anh.' },
      { unit: 'Bài 4', title: 'Kết thúc cuộc trò chuyện & Giữ liên lạc', desc: 'Cách xin thông tin liên hệ khéo léo và hẹn gặp lại tự nhiên.' }
    ]
  },
  {
    id: 'food-dining',
    title: 'Tiếng Anh Nhà Hàng, Ẩm Thực & Cafe',
    tagline: 'Làm chủ kỹ năng gọi món, review ẩm thực và giao lưu trong các buổi tiệc',
    level: 'Beginner - A1/A2',
    levelTag: 'A1 - A2',
    category: 'travel',
    categoryName: 'Du lịch & Đời sống',
    rating: 4.9,
    reviews: 380,
    students: 1650,
    duration: '12 bài học • 18 giờ',
    lessonsCount: 12,
    badge: '🍽️ Thực chiến',
    badgeColor: '#f97316',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
    icon: '🍔',
    topicParam: 'restaurant',
    overview: 'Khóa học sống động đưa bạn vào không gian ẩm thực phương Tây: từ quán cà phê vỉa hè đến nhà hàng fine dining sang trọng. Tự tin yêu cầu món ăn theo sở thích hoặc dị ứng.',
    syllabus: [
      { unit: 'Phần 1', title: 'Đặt bàn & Tiếp nhận menu', desc: 'Đặt bàn trước qua điện thoại, hỏi về món đặc trưng (Chef\'s special).' },
      { unit: 'Phần 2', title: 'Gọi món, yêu cầu đặc biệt & Đồ uống', desc: 'Cách gọi món khai vị, món chính, đồ uống, yêu cầu ăn chay hoặc không cay.' },
      { unit: 'Phần 3', title: 'Thưởng thức & Review món ăn', desc: 'Từ vựng miêu tả hương vị phong phú (crispy, savory, tender, creamy...).' },
      { unit: 'Phần 4', title: 'Thanh toán, Tip & Xử lý nhầm lẫn món ăn', desc: 'Văn hóa tip, chia hóa đơn (Split bill) và phản hồi lịch sự khi món ăn có vấn đề.' }
    ]
  }
];

const CATEGORIES = [
  { key: 'all', label: 'Tất cả khóa học', icon: '✨' },
  { key: 'speaking', label: 'Giao tiếp bản xứ', icon: '🗣️' },
  { key: 'pronunciation', label: 'Phát âm & Ngữ điệu', icon: '🎙️' },
  { key: 'career', label: 'Tiếng Anh công sở', icon: '💼' },
  { key: 'ielts', label: 'Luyện thi IELTS', icon: '🎯' },
  { key: 'travel', label: 'Du lịch & Đời sống', icon: '✈️' }
];

function Courses() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [activeCourseModal, setActiveCourseModal] = useState(null);

  // Filter courses
  const filteredCourses = useMemo(() => {
    return COURSES_DATA.filter(course => {
      const matchCategory = selectedCategory === 'all' || course.category === selectedCategory;
      const matchSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLevel = selectedLevel === 'all' || 
                         (selectedLevel === 'beginner' && (course.levelTag.includes('A1') || course.levelTag.includes('A2'))) ||
                         (selectedLevel === 'intermediate' && (course.levelTag.includes('B1') || course.levelTag.includes('B2'))) ||
                         (selectedLevel === 'advanced' && (course.levelTag.includes('C1') || course.levelTag.includes('C2')));
      return matchCategory && matchSearch && matchLevel;
    });
  }, [selectedCategory, searchQuery, selectedLevel]);

  const handleStartCourse = (course) => {
    // Navigate straight to conversation with relevant topic or scenario
    navigate(`/conversation?topic=${course.topicParam || 'daily_life'}`);
  };

  return (
    <div className="courses-catalog-page">
      {/* Hero Header */}
      <section className="courses-hero">
        <div className="courses-hero-container">
          <div className="hero-pill-badge">
            <ThunderboltOutlined style={{ color: '#00c6ff', marginRight: 6 }} />
            HỆ THỐNG KHÓA HỌC EDTECH 2.0
          </div>
          <Title level={1} className="courses-hero-title">
            Kho Khóa Học Tiếng Anh <span className="text-gradient">AI Thực Chiến</span>
          </Title>
          <Paragraph className="courses-hero-subtitle">
            Học chuẩn lộ trình quốc tế từ mất gốc đến tự tin đàm phán thương mại và bứt phá IELTS. Tương tác luyện nói 1:1 cùng AI Simulator mỗi ngày.
          </Paragraph>

          {/* Quick Metrics */}
          <div className="courses-metrics-bar">
            <div className="metric-box">
              <span className="metric-number">100+</span>
              <span className="metric-label">Tình huống thực tế</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-box">
              <span className="metric-number">24/7</span>
              <span className="metric-label">AI Luyện giọng 1:1</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-box">
              <span className="metric-number">18,500+</span>
              <span className="metric-label">Học viên tham gia</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-box">
              <span className="metric-number">4.9 ⭐</span>
              <span className="metric-label">Độ hài lòng cao</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <div className="courses-main-container">
        {/* Search & Filter Bar */}
        <div className="courses-filter-wrapper">
          <div className="search-and-select-row">
            <Input
              size="large"
              placeholder="Tìm kiếm khóa học, kỹ năng, chủ đề..."
              prefix={<SearchOutlined style={{ color: '#94a3b8', fontSize: 18 }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="course-search-input"
              allowClear
            />
            <Select
              size="large"
              value={selectedLevel}
              onChange={setSelectedLevel}
              className="course-level-select"
              options={[
                { value: 'all', label: '⭐ Tất cả trình độ' },
                { value: 'beginner', label: '🌱 Mất gốc & Cơ bản (A1 - A2)' },
                { value: 'intermediate', label: '🌿 Trung cấp & Tự tin (B1 - B2)' },
                { value: 'advanced', label: '🌳 Nâng cao & IELTS (C1 - C2)' }
              ]}
            />
          </div>

          {/* Category Tabs */}
          <div className="category-chips-row">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                type="button"
                className={`category-chip ${selectedCategory === cat.key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.key)}
              >
                <span className="chip-icon">{cat.icon}</span>
                <span className="chip-label">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="courses-count-bar">
          <Text className="count-text">
            Tìm thấy <strong>{filteredCourses.length}</strong> khóa học phù hợp
          </Text>
          <div className="badge-free-hint">
            <span>🎁 Mọi khóa học đều có kịch bản AI luyện nói miễn phí</span>
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="empty-courses-state">
            <Empty
              description="Không tìm thấy khóa học nào phù hợp với bộ lọc hiện tại"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedLevel('all'); }}>
                Xóa bộ lọc
              </Button>
            </Empty>
          </div>
        ) : (
          <Row gutter={[24, 28]} className="courses-grid-row">
            {filteredCourses.map(course => (
              <Col xs={24} sm={12} lg={8} key={course.id}>
                <div className="edtech-course-card">
                  {/* Card Header Banner */}
                  <div className="card-top-banner" style={{ background: course.gradient }}>
                    <div className="banner-badge-row">
                      <span className="course-type-pill">{course.categoryName}</span>
                      <span className="course-level-pill">{course.levelTag}</span>
                    </div>
                    <div className="banner-center-icon">
                      <span className="big-course-emoji">{course.icon}</span>
                    </div>
                    {course.badge && (
                      <div className="banner-ribbon-tag">
                        {course.badge}
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="card-content-body">
                    <Title level={4} className="course-card-title">
                      {course.title}
                    </Title>
                    <Paragraph className="course-card-tagline" ellipsis={{ rows: 2 }}>
                      {course.tagline}
                    </Paragraph>

                    {/* Metadata tags */}
                    <div className="course-features-chips">
                      <span className="feature-chip">
                        <BookOutlined style={{ color: '#0072ff' }} /> {course.lessonsCount} bài học
                      </span>
                      <span className="feature-chip">
                        <ClockCircleOutlined style={{ color: '#10b981' }} /> {course.duration.split('•')[0]}
                      </span>
                      <span className="feature-chip">
                        <UserOutlined style={{ color: '#8b5cf6' }} /> {course.students.toLocaleString()} học viên
                      </span>
                    </div>

                    <div className="card-rating-row">
                      <div className="rating-box">
                        <StarFilled style={{ color: '#f59e0b', fontSize: 16 }} />
                        <span className="rating-score">{course.rating}</span>
                        <span className="rating-count">({course.reviews})</span>
                      </div>
                      <span className="ai-voice-badge">
                        <SoundOutlined /> AI Simulator
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="card-actions-row">
                      <Button
                        type="default"
                        className="btn-view-syllabus"
                        onClick={() => setActiveCourseModal(course)}
                      >
                        Lộ trình
                      </Button>
                      <Button
                        type="primary"
                        className="btn-start-course"
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleStartCourse(course)}
                      >
                        Luyện nói AI
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}

        {/* Bottom Banner CTA */}
        <section className="courses-bottom-cta">
          <div className="cta-glass-card">
            <Row align="middle" gutter={[32, 24]}>
              <Col xs={24} md={16}>
                <span className="cta-sparkle-pill">⚡ HỌC KHÔNG GIỚI HẠN</span>
                <Title level={2} className="cta-banner-title">
                  Mở Khóa Toàn Bộ Khóa Học & Gia Sư AI Không Giới Hạn
                </Title>
                <Paragraph className="cta-banner-desc">
                  Nâng cấp gói VIP để tận hưởng kho bài giảng đầy đủ, luyện phát âm không giới hạn thời lượng cùng bảng phân tích ngữ điệu chi tiết.
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{ textAlign: 'center' }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    size="large"
                    shape="round"
                    className="btn-cta-vip"
                    onClick={() => navigate('/payment')}
                  >
                    👑 Khám Phá Gói VIP
                  </Button>
                  <Button
                    type="text"
                    className="btn-cta-test"
                    onClick={() => navigate('/conversation')}
                  >
                    Học thử 1 buổi miễn phí →
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>
        </section>
      </div>

      {/* Syllabus & Curriculum Modal */}
      {activeCourseModal && (
        <Modal
          title={null}
          open={!!activeCourseModal}
          onCancel={() => setActiveCourseModal(null)}
          footer={null}
          width={720}
          className="course-syllabus-modal"
          centered
        >
          <div className="modal-course-header" style={{ background: activeCourseModal.gradient }}>
            <span className="modal-course-icon">{activeCourseModal.icon}</span>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>
              {activeCourseModal.title}
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', margin: '8px 0 0' }}>
              {activeCourseModal.tagline}
            </Paragraph>
          </div>

          <div className="modal-course-body">
            <Title level={5} style={{ color: '#1e293b', marginBottom: 8 }}>
              📖 Tổng Quan Khóa Học
            </Title>
            <Paragraph style={{ color: '#475569', lineHeight: 1.7 }}>
              {activeCourseModal.overview}
            </Paragraph>

            <Title level={5} style={{ color: '#1e293b', marginTop: 24, marginBottom: 12 }}>
              🎯 Chi Tiết Lộ Trình (Syllabus)
            </Title>

            <div className="syllabus-timeline">
              {activeCourseModal.syllabus.map((item, idx) => (
                <div key={idx} className="syllabus-unit-box">
                  <div className="unit-number-badge">{idx + 1}</div>
                  <div className="unit-content">
                    <Text strong className="unit-title">{item.unit}: {item.title}</Text>
                    <Paragraph className="unit-desc">{item.desc}</Paragraph>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer-cta">
              <Button
                type="primary"
                size="large"
                shape="round"
                icon={<PlayCircleOutlined />}
                block
                className="btn-modal-action"
                onClick={() => {
                  setActiveCourseModal(null);
                  handleStartCourse(activeCourseModal);
                }}
              >
                Vào Phòng Luyện Nói AI Ngay Bây Giờ
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Courses;
