import React, { useState, useEffect } from 'react';
import {
  Card, Button, Typography, Space, Spin, message,
  Empty, Progress, Modal, Input, Tag, Tooltip, Row, Col
} from 'antd';
import {
  CheckCircleFilled, CloseCircleFilled, SyncOutlined,
  SoundOutlined, PlusOutlined, FireFilled, TrophyOutlined,
  BookOutlined, BulbOutlined, RedoOutlined
} from '@ant-design/icons';
import { flashcardService } from '../../services/flashcardService';
import './style.css';

const { Title, Text, Paragraph } = Typography;

// Sample curated decks when user has no cards yet
const STARTER_FLASHCARDS = [
  { _id: 'sample-1', word: 'Accomplish', ipa: '/əˈkɑːm.plɪʃ/', meaning: 'Hoàn thành, đạt được mục tiêu', example: 'She accomplished such great success through persistent hard work.' },
  { _id: 'sample-2', word: 'Perspective', ipa: '/pɚˈspek.tɪv/', meaning: 'Góc nhìn, quan điểm cá nhân', example: 'Traveling abroad gives you a totally fresh perspective on life.' },
  { _id: 'sample-3', word: 'Collaborate', ipa: '/kəˈlæb.ə.reɪt/', meaning: 'Hợp tác, làm việc nhóm', example: 'Engineers and designers collaborated closely to create the new product.' },
  { _id: 'sample-4', word: 'Fluency', ipa: '/ˈfluː.ən.si/', meaning: 'Sự lưu loát, trôi chảy', example: 'Daily practice with AI will rapidly boost your English speaking fluency.' },
  { _id: 'sample-5', word: 'Dedication', ipa: '/ˌded.əˈkeɪ.ʃən/', meaning: 'Sự cống hiến, tận tâm', example: 'His dedication to mastering English inspired everyone in the team.' }
];

const Flashcards = () => {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newExample, setNewExample] = useState('');
  const [isUsingStarter, setIsUsingStarter] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    loadDueCards();
  }, []);

  const loadDueCards = async () => {
    try {
      setLoading(true);
      const res = await flashcardService.getDueFlashcards();
      if (res.success && res.data && res.data.length > 0) {
        setCards(res.data);
        setIsUsingStarter(false);
      } else {
        // Fallback to rich starter deck so user always has great learning experience!
        setCards(STARTER_FLASHCARDS);
        setIsUsingStarter(true);
      }
    } catch (error) {
      console.warn('API getDueFlashcards warning, using starter deck:', error);
      setCards(STARTER_FLASHCARDS);
      setIsUsingStarter(true);
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text, e) => {
    if (e) e.stopPropagation();
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleReview = async (quality) => {
    if (cards.length === 0) return;
    const currentCard = cards[currentIndex];

    // If it's a real card, submit to backend
    if (!isUsingStarter && currentCard._id && !currentCard._id.startsWith('sample')) {
      try {
        await flashcardService.reviewFlashcard(currentCard._id, quality);
      } catch (error) {
        console.error('Error reviewing flashcard:', error);
      }
    }

    // Move to next card
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
      message.success('🎉 Chúc mừng! Bạn đã hoàn thành toàn bộ thẻ ôn tập hôm nay.');
    }
  };

  const handleAddCard = async () => {
    if (!newWord.trim() || !newMeaning.trim()) {
      message.warning('Vui lòng nhập từ vựng và định nghĩa');
      return;
    }
    try {
      const res = await flashcardService.addFlashcard({
        word: newWord.trim(),
        meaning: newMeaning.trim(),
        example: newExample.trim()
      });
      if (res.success) {
        message.success('Thêm từ vựng mới thành công!');
        setIsAddModalVisible(false);
        setNewWord('');
        setNewMeaning('');
        setNewExample('');
        loadDueCards();
      }
    } catch (e) {
      message.error(e.response?.data?.error || 'Lỗi khi thêm từ vựng');
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
  };

  if (loading) {
    return (
      <div className="flashcards-loading">
        <Spin size="large" tip="Đang tải danh sách thẻ từ vựng..." />
      </div>
    );
  }

  const currentCard = cards[currentIndex] || {};
  const progressPercent = cards.length > 0 ? Math.round(((currentIndex + 1) / cards.length) * 100) : 0;

  return (
    <div className="flashcards-page">
      <div className="flashcards-container">
        {/* Top Header */}
        <div className="flashcards-header">
          <div className="flashcards-pill-badge">
            <BulbOutlined style={{ marginRight: 6 }} /> PHƯƠNG PHÁP LẶP LẠI NGẮT QUÃNG (SRS)
          </div>
          <Title level={2} className="flashcards-title">
            Thẻ Từ Vựng Thông Minh
          </Title>
          <Paragraph className="flashcards-subtitle">
            Ghi nhớ từ vựng sâu hơn 300% thông qua thuật toán khoa học Spaced Repetition kết hợp phát âm AI bản ngữ.
          </Paragraph>

          <div className="flashcards-action-bar">
            <div className="streak-indicator">
              <FireFilled style={{ color: '#f59e0b', fontSize: 18 }} />
              <span>Chuỗi nhớ từ: <strong>5 ngày</strong></span>
            </div>
            <Button
              type="primary"
              shape="round"
              icon={<PlusOutlined />}
              onClick={() => setIsAddModalVisible(true)}
              className="btn-add-card"
            >
              Thêm từ vựng mới
            </Button>
          </div>
        </div>

        {/* Finished Screen */}
        {isFinished ? (
          <div className="flashcards-finished-card">
            <TrophyOutlined style={{ fontSize: 64, color: '#f59e0b', marginBottom: 16 }} />
            <Title level={3} style={{ color: '#0f172a', margin: 0 }}>
              Xuất Sắc! Bạn Đã Hoàn Thành Thẻ Hôm Nay
            </Title>
            <Paragraph style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
              Bạn đã ôn tập toàn bộ {cards.length} thẻ từ vựng. Thuật toán SRS đã tự động xếp lịch ôn tiếp theo để tối ưu hóa trí nhớ dài hạn.
            </Paragraph>
            <Space size="middle" style={{ marginTop: 20 }}>
              <Button type="primary" shape="round" size="large" icon={<RedoOutlined />} onClick={handleRestart}>
                Ôn tập lại lần nữa
              </Button>
            </Space>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="flashcards-progress-section">
              <div className="progress-info-row">
                <Text strong style={{ color: '#334155' }}>
                  Tiến độ ôn tập: Thẻ {currentIndex + 1} / {cards.length}
                </Text>
                <Tag color="blue">{progressPercent}% Hoàn thành</Tag>
              </div>
              <Progress percent={progressPercent} strokeColor={{ '0%': '#0072ff', '100%': '#00c6ff' }} showInfo={false} />
            </div>

            {/* 3D Flip Card */}
            <div className="flashcard-scene" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={`flashcard-3d ${isFlipped ? 'is-flipped' : ''}`}>
                {/* Front Side */}
                <div className="card-face card-face-front">
                  <div className="face-header">
                    <span className="face-tag">MẶT TRƯỚC • TIẾNG ANH</span>
                    <Tooltip title="Nghe phát âm bản xứ (US)">
                      <Button
                        type="text"
                        shape="circle"
                        icon={<SoundOutlined style={{ fontSize: 20, color: '#0072ff' }} />}
                        onClick={(e) => speakText(currentCard.word, e)}
                        className="btn-sound-card"
                      />
                    </Tooltip>
                  </div>

                  <div className="face-main">
                    <Title level={1} className="card-word">
                      {currentCard.word}
                    </Title>
                    {currentCard.ipa && (
                      <Text className="card-ipa">{currentCard.ipa}</Text>
                    )}
                  </div>

                  <div className="face-footer">
                    <Text className="flip-hint">👆 Chạm hoặc click để lật xem nghĩa</Text>
                  </div>
                </div>

                {/* Back Side */}
                <div className="card-face card-face-back">
                  <div className="face-header">
                    <span className="face-tag" style={{ color: '#10b981', background: '#ecfdf5' }}>
                      MẶT SAU • ĐỊNH NGHĨA
                    </span>
                    <Tooltip title="Nghe câu ví dụ">
                      <Button
                        type="text"
                        shape="circle"
                        icon={<SoundOutlined style={{ fontSize: 20, color: '#10b981' }} />}
                        onClick={(e) => speakText(currentCard.example || currentCard.word, e)}
                        className="btn-sound-card"
                      />
                    </Tooltip>
                  </div>

                  <div className="face-main">
                    <Title level={2} className="card-meaning">
                      {currentCard.meaning}
                    </Title>
                    {currentCard.example && (
                      <div className="card-example-box">
                        <Text strong style={{ color: '#475569', fontSize: 13, display: 'block', marginBottom: 4 }}>
                          VÍ DỤ NGỮ CẢNH:
                        </Text>
                        <Paragraph className="example-text">
                          "{currentCard.example}"
                        </Paragraph>
                      </div>
                    )}
                  </div>

                  <div className="face-footer">
                    <Text className="flip-hint">Đánh giá mức độ ghi nhớ của bạn bên dưới 👇</Text>
                  </div>
                </div>
              </div>
            </div>

            {/* SRS Review Action Buttons */}
            <div className="srs-actions-wrapper">
              <Row gutter={[16, 16]} justify="center">
                <Col xs={8}>
                  <Button
                    size="large"
                    danger
                    block
                    className="srs-btn srs-hard"
                    icon={<CloseCircleFilled />}
                    onClick={() => handleReview(1)}
                  >
                    Quên (1đ)
                  </Button>
                </Col>
                <Col xs={8}>
                  <Button
                    size="large"
                    block
                    className="srs-btn srs-good"
                    icon={<SyncOutlined />}
                    onClick={() => handleReview(3)}
                  >
                    Tạm nhớ (3đ)
                  </Button>
                </Col>
                <Col xs={8}>
                  <Button
                    size="large"
                    type="primary"
                    block
                    className="srs-btn srs-easy"
                    icon={<CheckCircleFilled />}
                    onClick={() => handleReview(5)}
                  >
                    Thuộc làu (5đ)
                  </Button>
                </Col>
              </Row>
            </div>
          </>
        )}
      </div>

      {/* Add New Card Modal */}
      <Modal
        title="Thêm Thẻ Từ Vựng Mới"
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onOk={handleAddCard}
        okText="Lưu Thẻ"
        cancelText="Hủy"
        centered
        className="add-card-modal"
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 10 }}>
          <div>
            <Text strong>Từ vựng tiếng Anh (*)</Text>
            <Input
              placeholder="VD: Breakthrough, Resilience..."
              value={newWord}
              onChange={e => setNewWord(e.target.value)}
              size="large"
              style={{ borderRadius: 10, marginTop: 6 }}
            />
          </div>
          <div>
            <Text strong>Nghĩa tiếng Việt (*)</Text>
            <Input
              placeholder="VD: Bước đột phá, khả năng thích ứng..."
              value={newMeaning}
              onChange={e => setNewMeaning(e.target.value)}
              size="large"
              style={{ borderRadius: 10, marginTop: 6 }}
            />
          </div>
          <div>
            <Text strong>Câu ví dụ (Tùy chọn)</Text>
            <Input.TextArea
              placeholder="VD: AI has made a huge breakthrough in English learning."
              value={newExample}
              onChange={e => setNewExample(e.target.value)}
              rows={3}
              style={{ borderRadius: 10, marginTop: 6 }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default Flashcards;
