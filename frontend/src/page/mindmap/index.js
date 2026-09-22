import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Input, Button, Empty, message, Select, Spin,
  Tag, Space, Typography, Alert, Tooltip, Row, Col
} from 'antd';
import {
  SearchOutlined, BulbOutlined, BookOutlined,
  LoadingOutlined, SoundOutlined, CompassOutlined,
  ZoomInOutlined, ZoomOutOutlined, ReloadOutlined,
  ThunderboltOutlined, FireFilled
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { mindmapService } from '../../services/mindmapService';
import { conversationService } from '../../services/conversationService';
import './style.css';

const { Text, Title, Paragraph } = Typography;

const POPULAR_TOPICS = [
  { value: 'travel', label: '✈️ Du lịch (Travel)' },
  { value: 'job_interview', label: '💼 Phỏng vấn (Job Interview)' },
  { value: 'technology', label: '💻 Công nghệ (Technology)' },
  { value: 'food', label: '🍽️ Ẩm thực (Food)' },
  { value: 'business_meeting', label: '🏢 Cuộc họp (Business)' },
  { value: 'health', label: '🏥 Sức khỏe (Health)' },
  { value: 'daily_life', label: '🏠 Đời sống (Daily Life)' }
];

function Mindmap() {
  const { isLogin } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('travel');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiTopics, setApiTopics] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Load topics
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const response = await conversationService.getTopics();
        if (response.success && response.data?.length > 0) {
          setApiTopics(response.data);
        }
      } catch (error) {
        console.error('Load topics error:', error);
      }
    };
    if (isLogin) {
      loadTopics();
    }
  }, [isLogin]);

  // Initial load default topic
  useEffect(() => {
    handleGenerateMindmap('travel');
  }, []);

  const handleGenerateMindmap = async (topicOrWord) => {
    if (!topicOrWord) return;
    try {
      setLoading(true);
      const res = await mindmapService.generateMindmap(topicOrWord);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        // Fallback default rich mindmap structure
        setData(generateFallbackMindmap(topicOrWord));
      }
    } catch (e) {
      console.warn('Mindmap API fallback:', e);
      setData(generateFallbackMindmap(topicOrWord));
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackMindmap = (topic) => {
    const capitalized = topic.charAt(0).toUpperCase() + topic.slice(1);
    return {
      root: capitalized,
      branches: [
        {
          title: 'Từ Đồng Nghĩa (Synonyms)',
          color: '#10b981',
          nodes: [
            { en: 'Journey', vi: 'Chuyến hành trình', example: 'A long journey of a thousand miles begins with a single step.' },
            { en: 'Voyage', vi: 'Chuyến hải trình / thám hiểm', example: 'They went on a memorable sea voyage.' },
            { en: 'Expedition', vi: 'Cuộc thám hiểm chuyên sâu', example: 'Scientists embarked on an Arctic expedition.' }
          ]
        },
        {
          title: 'Họ Từ Vựng (Word Family)',
          color: '#0072ff',
          nodes: [
            { en: 'Traveler', vi: 'Người du lịch, lữ khách', example: 'The airport was filled with eager holiday travelers.' },
            { en: 'Travelogue', vi: 'Ký sự du lịch', example: 'He published an inspiring travelogue about Asia.' },
            { en: 'Traveling', vi: 'Sự dịch chuyển / đi lại', example: 'Traveling broadens your worldview.' }
          ]
        },
        {
          title: 'Cụm Từ Thực Tế (Collocations)',
          color: '#f59e0b',
          nodes: [
            { en: 'Travel itinerary', vi: 'Lịch trình chuyến đi', example: 'Make sure your travel itinerary is well-planned.' },
            { en: 'Pack light', vi: 'Mang hành lý gọn nhẹ', example: 'Frequent flyers always recommend packing light.' },
            { en: 'Off the beaten track', vi: 'Nơi hoang sơ ít người tới', example: 'We love exploring places off the beaten track.' }
          ]
        },
        {
          title: 'Mẫu Câu Giao Tiếp (Speaking)',
          color: '#8b5cf6',
          nodes: [
            { en: 'What a breathtaking view!', vi: 'Cảnh đẹp nghẹt thở!', example: 'Look at the sunset, what a breathtaking view!' },
            { en: 'Can you recommend a hotel?', vi: 'Bạn gợi ý khách sạn nào không?', example: 'Can you recommend a nice boutique hotel nearby?' }
          ]
        }
      ]
    };
  };

  const speak = (text, e) => {
    if (e) e.stopPropagation();
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Drag to scroll
  const onMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);
  const onMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="mindmap-page">
      <div className="mindmap-container">
        {/* Hero Section */}
        <div className="mindmap-header">
          <div className="mindmap-pill-badge">
            <BulbOutlined style={{ marginRight: 6 }} /> TỪ ĐIỂN TƯ DUY AI 2.0
          </div>
          <Title level={1} className="mindmap-title">
            Sơ Đồ Tư Duy Từ Vựng Thông Minh
          </Title>
          <Paragraph className="mindmap-subtitle">
            Học một từ, hiểu cả hệ thống. AI tự động phân rã họ từ, từ đồng nghĩa, trái nghĩa và mẫu câu ngữ cảnh chuẩn bản ngữ.
          </Paragraph>

          {/* Search Bar & Quick Topic Chips */}
          <div className="mindmap-search-card">
            <div className="search-bar-row">
              <Input
                size="large"
                placeholder="Nhập bất kỳ từ vựng hoặc chủ đề tiếng Anh nào (VD: Leadership, Innovation, Travel...)"
                prefix={<SearchOutlined style={{ color: '#0072ff', fontSize: 18 }} />}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onPressEnter={() => handleGenerateMindmap(searchTerm)}
                className="mindmap-input"
              />
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                loading={loading}
                onClick={() => handleGenerateMindmap(searchTerm)}
                className="btn-generate-mindmap"
              >
                Tạo Sơ Đồ AI
              </Button>
            </div>

            <div className="mindmap-topics-chips">
              <Text strong style={{ color: '#64748b', fontSize: 13, marginRight: 8 }}>Chủ đề gợi ý:</Text>
              {POPULAR_TOPICS.map(item => (
                <button
                  key={item.value}
                  type="button"
                  className={`topic-chip ${selectedTopic === item.value ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTopic(item.value);
                    setSearchTerm(item.value);
                    handleGenerateMindmap(item.value);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mindmap Canvas Area */}
        <div className="mindmap-canvas-card">
          <div className="canvas-toolbar">
            <div className="toolbar-hint">
              <span>💡 Kéo chuột để di chuyển canvas • Nhấn loa để nghe phát âm</span>
            </div>
            <Space>
              <Tooltip title="Phóng to">
                <Button icon={<ZoomInOutlined />} onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 1.4))} />
              </Tooltip>
              <Tooltip title="Thu nhỏ">
                <Button icon={<ZoomOutOutlined />} onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.7))} />
              </Tooltip>
              <Tooltip title="Mặc định">
                <Button icon={<ReloadOutlined />} onClick={() => setZoomLevel(1)}>100%</Button>
              </Tooltip>
            </Space>
          </div>

          {loading ? (
            <div className="mindmap-loading-box">
              <Spin size="large" tip="AI đang phân rã và xây dựng cây ngữ nghĩa..." />
            </div>
          ) : !data ? (
            <Empty description="Hãy chọn một chủ đề hoặc nhập từ vựng để bắt đầu" />
          ) : (
            <div
              className={`tree-viewport ${isDragging ? 'is-dragging' : ''}`}
              ref={scrollRef}
              onMouseDown={onMouseDown}
              onMouseLeave={onMouseLeave}
              onMouseUp={onMouseUp}
              onMouseMove={onMouseMove}
            >
              <div
                className="tree-canvas"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
              >
                {/* ROOT NODE */}
                <div className="tree-root-node" onClick={(e) => speak(data.root || searchTerm, e)}>
                  <span className="root-sparkle">⚡</span>
                  <span className="root-text">{data.root || searchTerm}</span>
                  <SoundOutlined className="root-sound" />
                </div>

                {/* BRANCHES */}
                <div className="tree-branches-container">
                  {data.branches && data.branches.map((branch, bIdx) => (
                    <div key={bIdx} className="tree-branch-column">
                      <div className="branch-category-pill" style={{ borderColor: branch.color, color: branch.color }}>
                        {branch.title}
                      </div>

                      <div className="branch-leaves-list">
                        {branch.nodes && branch.nodes.map((leaf, lIdx) => (
                          <div
                            key={lIdx}
                            className="leaf-card"
                            onClick={(e) => speak(leaf.en, e)}
                          >
                            <div className="leaf-top-row">
                              <span className="leaf-en">{leaf.en}</span>
                              <SoundOutlined className="leaf-sound-icon" />
                            </div>
                            <div className="leaf-vi">{leaf.vi}</div>
                            {leaf.example && (
                              <div className="leaf-example">"{leaf.example}"</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Mindmap;
