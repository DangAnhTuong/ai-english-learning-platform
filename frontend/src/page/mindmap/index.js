import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Input, Button, Empty, message, Select, Spin, Tag, Space, Typography, Alert } from 'antd';
import { SearchOutlined, BulbOutlined, BookOutlined, LoadingOutlined, SoundOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { mindmapService } from '../../services/mindmapService';
import { conversationService } from '../../services/conversationService';
import './style.css';

const { Text, Title } = Typography;

// Fallback topics khi API chưa load
const FALLBACK_TOPICS = [
    { value: 'travel', label: '✈️ Du lịch (Travel)' },
    { value: 'work', label: '💼 Công việc (Work)' },
    { value: 'food', label: '🍽️ Ẩm thực (Food)' },
    { value: 'health', label: '🏥 Sức khỏe (Health)' },
    { value: 'education', label: '🎓 Giáo dục (Education)' },
    { value: 'technology', label: '💻 Công nghệ (Technology)' },
    { value: 'shopping', label: '🛍️ Mua sắm (Shopping)' },
    { value: 'family', label: '👨‍👩‍👧‍👦 Gia đình (Family)' },
];

// Icon mapping cho topics
const TOPIC_ICONS = {
    'restaurant': '🍽️', 'shopping': '🛍️', 'job_interview': '💼',
    'travel': '✈️', 'business_meeting': '🏢', 'medical_appointment': '🏥',
    'education': '🎓', 'friendship': '👥', 'family': '👨‍👩‍👧‍👦',
    'hobbies': '🎨', 'sports': '⚽', 'technology': '💻',
    'food': '🍔', 'weather': '🌤️', 'health': '💪',
    'movies': '🎬', 'music': '🎵', 'work': '💼',
    'daily_life': '🏠', 'school': '📚',
};

function Mindmap() {
    const { isLogin } = useSelector((state) => state.auth);
    
    // State quản lý
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [apiTopics, setApiTopics] = useState([]);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('topic'); 

    // Ref và State cho tính năng Kéo thả (Drag & Pan)
    const scrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // Load topics từ API khi component mount
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

    const capitalizeWords = (str) => {
        if (!str) return '';
        return str.replace(/_/g, ' ').split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const topicOptions = useMemo(() => {
        if (apiTopics.length > 0) {
            return apiTopics.map(topic => {
                const key = topic.name?.toLowerCase().replace(/\s+/g, '_');
                const icon = TOPIC_ICONS[key] || '💬';
                return {
                    value: topic.name,
                    label: `${icon} ${capitalizeWords(topic.name)} (${topic.count || 0})`
                };
            });
        }
        return FALLBACK_TOPICS;
    }, [apiTopics]);

    // TÍNH NĂNG ĐỌC TTS (Text to Speech)
    const speak = (text, e) => {
        if (e) e.stopPropagation();
        if (!text) return;
        // Lọc bỏ icon, nghĩa tiếng Việt để AI đọc tiếng Anh chuẩn
        const cleanText = text.replace(/📝/g, '').split('-')[0].split(':')[0].trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    };

    // TÍNH NĂNG CLICK VÀO TỪ CON ĐỂ TRA TIẾP
    // TÍNH NĂNG CHỈ TRA TỪ KHI BẤM KÍNH LÚP
    const handleExploreWord = (text, e) => {
        e.stopPropagation(); // Ngăn sự kiện click lây lan
        const cleanWord = text.replace(/📝/g, '').split('-')[0].split(':')[0].trim();
        setSearchTerm(cleanWord);
        handleSearch(cleanWord);
    };

    // 1. XỬ LÝ KHI TÌM KIẾM TỪ (Hỗ trợ tra từ truyền vào trực tiếp)
    const handleSearch = async (overrideWord = null) => {
        const wordToSearch = overrideWord || searchTerm;
        
        if (!wordToSearch.trim()) {
            message.warning('Vui lòng nhập từ cần tra cứu');
            return;
        }

        if (!isLogin) {
            message.warning('Vui lòng đăng nhập để sử dụng tính năng này');
            return;
        }

        setSearchLoading(true);
        setError(null);
        setMode('search');

        try {
            const response = await mindmapService.searchVocabulary(wordToSearch.trim());
            
            if (response.success && response.data?.length > 0) {
                const vocab = response.data[0];
                setData(convertVocabToMindmap(vocab));
                setSelectedTopic(null);
                message.success(`Đã tìm thấy từ: ${vocab.word}`);
            } else {
                message.info('Đang phân tích cấu trúc từ bằng AI...');
                await handleGenerateMindmap(wordToSearch.trim());
            }
        } catch (err) {
            setError('Không thể tra cứu từ. Vui lòng thử lại.');
        } finally {
            setSearchLoading(false);
        }
    };

    // Chuyển đổi vocabulary data sang mindmap format
    const convertVocabToMindmap = (vocab) => {
        const branches = [];
        if (vocab.meanings?.length > 0) branches.push({ category: 'Nghĩa (Meanings)', words: vocab.meanings.map(m => m.definition || m) });
        if (vocab.synonyms?.length > 0) branches.push({ category: 'Đồng nghĩa (Synonyms)', words: vocab.synonyms });
        if (vocab.antonyms?.length > 0) branches.push({ category: 'Trái nghĩa (Antonyms)', words: vocab.antonyms });
        if (vocab.wordFamily?.length > 0) branches.push({ category: 'Họ từ (Word Family)', words: vocab.wordFamily.map(wf => `${wf.word} (${wf.type})`) });
        if (vocab.collocations?.length > 0) branches.push({ category: 'Kết hợp từ (Collocations)', words: vocab.collocations });
        if (vocab.examples?.length > 0) branches.push({ category: 'Ví dụ (Examples)', words: vocab.examples.slice(0, 3) });

        return {
            word: vocab.word,
            meaning: vocab.pronunciation || '',
            type: `(${vocab.type || 'n/a'})`,
            branches: branches.length > 0 ? branches : [{ category: 'Thông tin', words: [vocab.definition || 'Không có thông tin chi tiết'] }]
        };
    };

    // 2. XỬ LÝ GENERATE MINDMAP BẰNG AI
    const handleGenerateMindmap = async (topic) => {
        if (!topic) return;
        setLoading(true);
        setError(null);
        setMode('topic');

        try {
            const response = await mindmapService.generateMindmap(topic);
            if (response.success && response.data) {
                setData(convertAIMindmapToDisplay(response.data, topic));
                message.success(`Đã tạo mindmap: ${topic}`);
            } else {
                throw new Error(response.error || 'Không thể tạo mindmap');
            }
        } catch (err) {
            setError('Không thể tạo mindmap. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    // Chuyển đổi AI mindmap response sang format hiển thị cây nhiều tầng
    const convertAIMindmapToDisplay = (aiData, topic) => {
        if (aiData.children && Array.isArray(aiData.children)) {
            const branches = aiData.children.map(branch => {
                const words = (branch.children || []).map(child => {
                    let text = child.label;
                    if (child.definition) text += ` - ${child.definition}`;
                    if (child.type === 'example' || child.label.includes('Example')) text = `📝 ${text}`;
                    return text;
                });
                return { category: branch.label, words: words };
            });

            return {
                word: aiData.label || topic.toUpperCase(),
                meaning: aiData.definition || '',
                type: 'AI Mindmap',
                branches: branches
            };
        }
        return {
            word: topic.toUpperCase(),
            meaning: 'AI Generator',
            type: 'Expert',
            branches: [{ category: 'Thông báo', words: ['Không thể phân tích dữ liệu. Vui lòng thử lại.'] }]
        };
    };

    const handleTopicChange = async (value) => {
        setSelectedTopic(value);
        setSearchTerm('');
        await handleGenerateMindmap(value);
    };

    const handleCustomTopic = () => {
        if (!searchTerm.trim()) {
            message.warning('Vui lòng nhập chủ đề');
            return;
        }
        handleGenerateMindmap(searchTerm.trim());
    };

    // Các hàm xử lý sự kiện Chuột để Kéo Thả Viewport
    const onMouseDown = (e) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };
    const onMouseLeave = () => setIsDragging(false);
    const onMouseUp = () => setIsDragging(false);
    const onMouseMove = (e) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 1.5; // Tốc độ cuộn
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const renderLoading = () => (
        <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <div style={{ marginTop: 20 }}><Text type="secondary">Đang phân tích và vẽ sơ đồ...</Text></div>
        </div>
    );

    const renderError = () => (
        <Alert message="Có lỗi xảy ra" description={error} type="error" showIcon
            action={<Button size="small" onClick={() => setError(null)}>Thử lại</Button>} style={{ margin: '20px 0' }}
        />
    );

    return (
        <div className="mindmap-page">
            <div className="mindmap-container">
                
                {/* --- KHUNG TÌM KIẾM --- */}
                <div className="search-box">
                    <Title level={2} style={{ marginBottom: 10, color: '#0075F3' }}>
                        <BulbOutlined /> Tra từ điển & Mindmap AI
                    </Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
                        Khám phá mạng lưới từ vựng thông minh
                    </Text>
                    
                    {!isLogin && (
                        <Alert message="Vui lòng đăng nhập để sử dụng đầy đủ tính năng" type="info" showIcon style={{ marginBottom: 20 }} />
                    )}

                    <div className="mindmap-search-controls">
                        <Select
                            placeholder="Chọn chủ đề có sẵn..."
                            value={selectedTopic}
                            style={{ width: 250 }}
                            onChange={handleTopicChange}
                            size="large"
                            loading={loading}
                            disabled={loading || searchLoading}
                            options={topicOptions}
                            allowClear
                            onClear={() => setSelectedTopic(null)}
                        />
                        <span style={{ color: '#999', fontWeight: 'bold' }}>HOẶC</span>
                        <div className="search-input-wrapper">
                            <Input 
                                size="large" 
                                placeholder="Nhập từ cần vẽ sơ đồ..." 
                                style={{ width: 280, border: 'none', background: 'transparent' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onPressEnter={() => handleSearch()}
                                disabled={loading || searchLoading}
                            />
                            <Space>
                                <Button type="primary" shape="round" size="large" icon={searchLoading ? <LoadingOutlined /> : <SearchOutlined />}
                                    onClick={() => handleSearch()} loading={searchLoading} disabled={loading}>
                                    Tra từ
                                </Button>
                                <Button type="default" shape="round" size="large" icon={loading ? <LoadingOutlined /> : <BulbOutlined />}
                                    onClick={handleCustomTopic} loading={loading} disabled={searchLoading}>
                                    Tạo Mindmap
                                </Button>
                            </Space>
                        </div>
                    </div>
                </div>

                {error && renderError()}

                {/* --- KHU VỰC VẼ SƠ ĐỒ (CÓ HỖ TRỢ KÉO THẢ CHUỘT) --- */}
                <div 
                    className={`tree-wrapper ${isDragging ? 'dragging' : ''}`}
                    ref={scrollRef}
                    onMouseDown={onMouseDown}
                    onMouseLeave={onMouseLeave}
                    onMouseUp={onMouseUp}
                    onMouseMove={onMouseMove}
                >
                    {loading ? renderLoading() : data ? (
                        <div className="tree">
                            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
                                <Tag color={mode === 'topic' ? 'blue' : 'green'} icon={mode === 'topic' ? <BulbOutlined /> : <BookOutlined />}>
                                    {mode === 'topic' ? 'AI Generated Mindmap' : 'Từ điển'}
                                </Tag>
                            </div>

                            <ul>
                                <li>
                                    {/* NODE GỐC (ROOT) */}
                                    <div className="node root" onClick={(e) => speak(data.word, e)}>
                                        <SoundOutlined style={{ marginRight: 8, opacity: 0.8 }} /> 
                                        {data.word}
                                        <div style={{ fontSize: 14, fontWeight: 400, marginTop: 5, textTransform: 'none' }}>
                                            {data.type} {data.meaning}
                                        </div>
                                    </div>
                                    
                                    {/* CÁC NHÁNH LỚN VÀ TỪ CON */}
                                    {data.branches && data.branches.length > 0 && (
                                        <ul>
                                            {data.branches.map((branch, index) => (
                                                <li key={index}>
                                                    <div className={`node category branch-${index % 4}`}>{branch.category}</div>
                                                    
                                                    {branch.words && branch.words.length > 0 && (
                                                        <ul>
                                                            {branch.words.map((w, i) => (
                                                                <li key={i}>
                                                                    <div 
                                                                        className="node leaf interactive" 
                                                                        onClick={(e) => speak(w, e)} // Bấm vào toàn bộ thẻ là chỉ để Đọc
                                                                    >
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                                            <span style={{ paddingRight: 10 }}>{w}</span>
                                                                            
                                                                            {/* Bấm kính lúp để Tra mindmap mới */}
                                                                            <div 
                                                                                className="explore-icon-wrapper"
                                                                                onClick={(e) => handleExploreWord(w, e)} 
                                                                                title="Tra từ này"
                                                                            >
                                                                                <SearchOutlined className="explore-icon" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            </ul>
                        </div>
                    ) : (
                        <Empty 
                            description={
                                <span>
                                    Chọn chủ đề hoặc nhập từ để bắt đầu<br/>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Mindmap sẽ hiển thị ở đây</Text>
                                </span>
                            } 
                            style={{ marginTop: 50 }} 
                        />
                    )}
                </div>

            </div>
        </div>
    );
}

export default Mindmap;