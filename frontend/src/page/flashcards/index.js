import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, Spin, message, Empty, Progress } from 'antd';
import { CheckOutlined, CloseOutlined, SyncOutlined } from '@ant-design/icons';
import { flashcardService } from '../../services/flashcardService';

const { Title, Text } = Typography;

const Flashcards = () => {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDueCards();
  }, []);

  const loadDueCards = async () => {
    try {
      setLoading(true);
      const res = await flashcardService.getDueFlashcards();
      if (res.success) {
        setCards(res.data);
      }
    } catch (error) {
      message.error('Không thể tải flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (quality) => {
    if (cards.length === 0) return;
    const currentCard = cards[currentIndex];
    
    try {
      await flashcardService.reviewFlashcard(currentCard._id, quality);
      
      // Move to next card
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        // Finished all cards
        message.success('Chúc mừng! Bạn đã hoàn thành bài ôn tập hôm nay.');
        setCards([]);
      }
    } catch (error) {
      message.error('Lỗi khi gửi kết quả');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
  }

  if (cards.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Empty 
          description="Bạn không có từ vựng nào cần ôn tập hôm nay!" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progressPercent = Math.round((currentIndex / cards.length) * 100);

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <Text strong>Tiến độ ôn tập</Text>
          <Text>{currentIndex} / {cards.length}</Text>
        </div>
        <Progress percent={progressPercent} showInfo={false} />
      </div>

      <div 
        style={{ 
          perspective: '1000px',
          height: '300px',
          marginBottom: '30px',
          cursor: 'pointer'
        }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <Card 
          style={{ 
            height: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s',
            transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)'
          }}
          bodyStyle={{ width: '100%' }}
        >
          {/* Front of card */}
          <div style={{ 
            position: 'absolute', 
            width: '100%', 
            backfaceVisibility: 'hidden',
            display: isFlipped ? 'none' : 'block'
          }}>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>{currentCard.word}</Title>
            <Text type="secondary" style={{ marginTop: 10, display: 'block' }}>Nhấn để lật thẻ</Text>
          </div>

          {/* Back of card */}
          <div style={{ 
            position: 'absolute', 
            width: '100%', 
            backfaceVisibility: 'hidden',
            transform: 'rotateX(180deg)',
            display: !isFlipped ? 'none' : 'block'
          }}>
            <Title level={3} style={{ margin: 0 }}>{currentCard.meaning}</Title>
            {currentCard.example && (
              <div style={{ marginTop: 20, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                <Text italic>"{currentCard.example}"</Text>
              </div>
            )}
          </div>
        </Card>
      </div>

      {isFlipped && (
        <div style={{ display: 'flex', justifyContent: 'space-around', gap: 10 }}>
          <Button 
            size="large" 
            danger 
            icon={<CloseOutlined />} 
            onClick={(e) => { e.stopPropagation(); handleReview(1); }}
            style={{ width: '30%' }}
          >
            Quên (Khó)
          </Button>
          <Button 
            size="large" 
            icon={<SyncOutlined />} 
            onClick={(e) => { e.stopPropagation(); handleReview(3); }}
            style={{ width: '30%' }}
          >
            Tạm (Bình thường)
          </Button>
          <Button 
            size="large" 
            type="primary" 
            icon={<CheckOutlined />} 
            onClick={(e) => { e.stopPropagation(); handleReview(5); }}
            style={{ width: '30%', backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Nhớ (Dễ)
          </Button>
        </div>
      )}
    </div>
  );
};

export default Flashcards;
