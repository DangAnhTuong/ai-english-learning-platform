import React, { useState, useEffect, useMemo } from 'react';
import { Input, Button, Empty, message, Select, Spin, Tag, Space, Typography, Alert } from 'antd';
import { SearchOutlined, BulbOutlined, BookOutlined, LoadingOutlined } from '@ant-design/icons';
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

    // Capitalize chuẩn cho tiếng Việt
    const capitalizeWords = (str) => {
        if (!str) return '';
        return str
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Build danh sách topics cho Select
    const topicOptions = useMemo(() => {
        if (apiTopics.length > 0) {
            return apiTopics.map(topic => {
                const key = topic.name?.toLowerCase().replace(/\s+/g, '_');
                const icon = TOPIC_ICONS[key] || '💬';
                const displayName = capitalizeWords(topic.name);
                return {
                    value: topic.name,
                    label: `${icon} ${displayName} (${topic.count || 0})`
                };
            });
        }
        return FALLBACK_TOPICS;
    }, [apiTopics]);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('topic'); // 'topic' | 'search'

    // 1. XỬ LÝ KHI TÌM KIẾM TỪ (Từ database)
    const handleSearch = async () => {
        if (!searchTerm.trim()) {
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
            const response = await mindmapService.searchVocabulary(searchTerm.trim());
            
            if (response.success && response.data?.length > 0) {
                const vocab = response.data[0];
                // Chuyển đổi từ vocabulary format sang mindmap format
                const mindmapData = convertVocabToMindmap(vocab);
                setData(mindmapData);
                setSelectedTopic(null);
                message.success(`Đã tìm thấy từ: ${vocab.word}`);
            } else {
                // Không tìm thấy trong DB, thử generate bằng AI
                message.info('Không tìm thấy trong từ điển, đang tạo mindmap bằng AI...');
                await handleGenerateMindmap(searchTerm.trim());
            }
        } catch (err) {
            console.error('Search error:', err);
            setError('Không thể tra cứu từ. Vui lòng thử lại.');
            message.error('Lỗi khi tra cứu từ');
        } finally {
            setSearchLoading(false);
        }
    };

    // Chuyển đổi vocabulary data sang mindmap format
    const convertVocabToMindmap = (vocab) => {
        const branches = [];

        // Thêm nghĩa
        if (vocab.meanings?.length > 0) {
            branches.push({
                category: 'Nghĩa (Meanings)',
                words: vocab.meanings.map(m => m.definition || m)
            });
        }

        // Thêm từ đồng nghĩa
        if (vocab.synonyms?.length > 0) {
            branches.push({
                category: 'Đồng nghĩa (Synonyms)',
                words: vocab.synonyms
            });
        }

        // Thêm từ trái nghĩa
        if (vocab.antonyms?.length > 0) {
            branches.push({
                category: 'Trái nghĩa (Antonyms)',
                words: vocab.antonyms
            });
        }

        // Thêm word family
        if (vocab.wordFamily?.length > 0) {
            branches.push({
                category: 'Họ từ (Word Family)',
                words: vocab.wordFamily.map(wf => `${wf.word} (${wf.type})`)
            });
        }

        // Thêm collocations
        if (vocab.collocations?.length > 0) {
            branches.push({
                category: 'Kết hợp từ (Collocations)',
                words: vocab.collocations
            });
        }

        // Thêm ví dụ
        if (vocab.examples?.length > 0) {
            branches.push({
                category: 'Ví dụ (Examples)',
                words: vocab.examples.slice(0, 3)
            });
        }

        return {
            word: vocab.word,
            meaning: vocab.pronunciation || '',
            type: `(${vocab.type || 'n/a'})`,
            branches: branches.length > 0 ? branches : [
                { category: 'Thông tin', words: [vocab.definition || 'Không có thông tin chi tiết'] }
            ]
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
                // Chuyển đổi AI response sang format hiển thị
                const mindmapData = convertAIMindmapToDisplay(response.data, topic);
                setData(mindmapData);
                message.success(`Đã tạo mindmap cho chủ đề: ${topic}`);
            } else {
                throw new Error(response.error || 'Không thể tạo mindmap');
            }
        } catch (err) {
            console.error('Generate mindmap error:', err);
            setError('Không thể tạo mindmap. Vui lòng thử lại sau.');
            message.error('Lỗi khi tạo mindmap');
        } finally {
            setLoading(false);
        }
    };

    // Chuyển đổi AI mindmap response sang format hiển thị
    const convertAIMindmapToDisplay = (aiData, topic) => {
        const branches = [];
        
        // Nếu có children, chuyển đổi thành branches
        if (aiData.children && aiData.children.length > 0) {
            aiData.children.forEach(child => {
                const words = [];
                
                // Thêm label chính
                if (child.definition) {
                    words.push(`${child.label}: ${child.definition}`);
                } else {
                    words.push(child.label);
                }
                
                // Thêm example nếu có
                if (child.example_sentence) {
                    words.push(`📝 ${child.example_sentence}`);
                }
                
                // Nếu child có children, thêm chúng
                if (child.children && child.children.length > 0) {
                    child.children.forEach(grandchild => {
                        words.push(grandchild.label);
                    });
                }

                branches.push({
                    category: child.label,
                    words: words.slice(1) // Bỏ label đầu tiên vì đã là category
                });
            });
        }

        return {
            word: aiData.label || topic.toUpperCase(),
            meaning: aiData.definition || 'AI Generated Mindmap',
            type: 'Topic',
            branches: branches.length > 0 ? branches : [
                { category: 'Nội dung', words: [aiData.definition || 'Chủ đề: ' + topic] }
            ]
        };
    };

    // 3. XỬ LÝ KHI CHỌN CHỦ ĐỀ PRESET
    const handleTopicChange = async (value) => {
        setSelectedTopic(value);
        setSearchTerm('');
        await handleGenerateMindmap(value);
    };

    // 4. XỬ LÝ NHẬP TOPIC TỰ DO
    const handleCustomTopic = () => {
        if (!searchTerm.trim()) {
            message.warning('Vui lòng nhập chủ đề');
            return;
        }
        handleGenerateMindmap(searchTerm.trim());
    };

    // Render loading state
    const renderLoading = () => (
        <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <div style={{ marginTop: 20 }}>
                <Text type="secondary">Đang tạo mindmap...</Text>
            </div>
        </div>
    );

    // Render error state
    const renderError = () => (
        <Alert
            message="Có lỗi xảy ra"
            description={error}
            type="error"
            showIcon
            action={
                <Button size="small" onClick={() => setError(null)}>
                    Thử lại
                </Button>
            }
            style={{ margin: '20px 0' }}
        />
    );

    return (
        <div className="mindmap-page">
            <div className="mindmap-container">
                
                {/* --- KHUNG TÌM KIẾM & CHỌN CHỦ ĐỀ --- */}
                <div className="search-box">
                    <Title level={2} style={{ marginBottom: 10, color: '#0075F3' }}>
                        <BulbOutlined /> Tra từ điển & Mindmap AI
                    </Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
                        Tra từ vựng hoặc tạo mindmap học từ theo chủ đề
                    </Text>
                    
                    {!isLogin && (
                        <Alert
                            message="Vui lòng đăng nhập để sử dụng đầy đủ tính năng"
                            type="info"
                            showIcon
                            style={{ marginBottom: 20 }}
                        />
                    )}

                    <div style={{ display: 'flex', gap: 15, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                        
                        {/* A. SELECT CHỌN CHỦ ĐỀ PRESET */}
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

                        {/* B. INPUT TÌM TỪ / NHẬP CHỦ ĐỀ */}
                        <div className="search-input-wrapper">
                            <Input 
                                size="large" 
                                placeholder="Nhập từ hoặc chủ đề..." 
                                style={{ width: 280, border: 'none', background: 'transparent' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onPressEnter={handleSearch}
                                disabled={loading || searchLoading}
                            />
                            <Space>
                                <Button 
                                    type="primary" 
                                    shape="round" 
                                    size="large" 
                                    icon={searchLoading ? <LoadingOutlined /> : <SearchOutlined />}
                                    onClick={handleSearch}
                                    loading={searchLoading}
                                    disabled={loading}
                                >
                                    Tra từ
                                </Button>
                                <Button
                                    type="default"
                                    shape="round"
                                    size="large"
                                    icon={loading ? <LoadingOutlined /> : <BulbOutlined />}
                                    onClick={handleCustomTopic}
                                    loading={loading}
                                    disabled={searchLoading}
                                >
                                    Tạo Mindmap
                                </Button>
                            </Space>
                        </div>
                    </div>
                    
                    <p style={{ marginTop: 15, color: '#888', fontSize: 13 }}>
                        💡 <strong>Mẹo:</strong> Chọn chủ đề để học tổng quát, hoặc nhập từ để tra nghĩa chi tiết. 
                        AI sẽ tự động tạo mindmap nếu từ không có trong từ điển.
                    </p>
                </div>

                {/* --- HIỂN THỊ TRẠNG THÁI --- */}
                {error && renderError()}

                {/* --- CÂY MINDMAP (HIỂN THỊ DỮ LIỆU) --- */}
                <div className="tree-wrapper">
                    {loading ? renderLoading() : data ? (
                        <div className="tree">
                            {/* Badge hiển thị mode */}
                            <div style={{ textAlign: 'center', marginBottom: 15 }}>
                                <Tag color={mode === 'topic' ? 'blue' : 'green'} icon={mode === 'topic' ? <BulbOutlined /> : <BookOutlined />}>
                                    {mode === 'topic' ? 'AI Generated Mindmap' : 'Từ điển'}
                                </Tag>
                            </div>

                            <ul>
                                <li>
                                    {/* 1. NODE GỐC (ROOT) */}
                                    <div className="node root">
                                        {data.word}
                                        <div style={{ fontSize: 14, fontWeight: 400, marginTop: 5, textTransform: 'none' }}>
                                            {data.type} {data.meaning}
                                        </div>
                                    </div>
                                    
                                    {/* 2. CÁC NHÁNH LỚN (BRANCHES) */}
                                    {data.branches && data.branches.length > 0 && (
                                        <ul>
                                            {data.branches.map((branch, index) => (
                                                <li key={index}>
                                                    {/* Node Danh mục */}
                                                    <div className="node category">{branch.category}</div>
                                                    
                                                    {/* 3. CÁC TỪ CON (LEAVES) */}
                                                    {branch.words && branch.words.length > 0 && (
                                                        <ul>
                                                            {branch.words.map((w, i) => (
                                                                <li key={i}>
                                                                    <div className="node leaf">{w}</div>
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
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Mindmap sẽ hiển thị ở đây
                                    </Text>
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
