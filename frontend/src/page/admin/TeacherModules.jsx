import React, { useState, useEffect } from 'react';
import { Tabs, Table, Button, Modal, Form, Input, InputNumber, Select, Space, Tag, message, Card, Alert, Upload, Image, Popconfirm, Spin, Progress, Tooltip } from 'antd';
import { adminService } from '../../services/adminService';
import AudioPlayer from '../../components/AudioPlayer';
import VoiceSettingsModal from '../../components/VoiceSettingsModal';
import ConversationDetailModal from '../../components/ConversationDetailModal';
import {
    MessageOutlined, PlusOutlined, DeleteOutlined, BookOutlined,
    BarsOutlined, EditOutlined, UploadOutlined, VideoCameraOutlined,
    SoundOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';

const { Option } = Select;


const TeacherModules = () => {
    // --- 1. STATE DỮ LIỆU (KHỞI TẠO TỪ LOCAL STORAGE) ---

    // Conversation config từ backend
    const [conversationConfig, setConversationConfig] = useState({
        minLines: 2,
        maxLines: 10,
        minParticipants: 2,
        maxParticipants: 5
    });

    // FR-01: Levels - Sử dụng API
    const [levels, setLevels] = useState([]);
    const [levelsLoading, setLevelsLoading] = useState(false);

    // FR-02: Conversations - Sử dụng API
    const [conversations, setConversations] = useState([]);
    const [conversationsLoading, setConversationsLoading] = useState(false);
    const [conversationTopics, setConversationTopics] = useState([]);
    const [conversationLevels, setConversationLevels] = useState([]);

    // FR-03: Dictionary - Sử dụng API
    const [dictionary, setDictionary] = useState([]);
    const [dictionaryLoading, setDictionaryLoading] = useState(false);
    const [tableRevision, setTableRevision] = useState(0); // Force table re-render

    // State quản lý Modal
    const [isLevelModal, setIsLevelModal] = useState(false);
    const [isConvModal, setIsConvModal] = useState(false);
    const [isDictModal, setIsDictModal] = useState(false);
    const [isVoiceSettingsModal, setIsVoiceSettingsModal] = useState(false);

    const [editingItem, setEditingItem] = useState(null);
    const [selectedConversationForAudio, setSelectedConversationForAudio] = useState(null);
    const [isConversationDetailModal, setIsConversationDetailModal] = useState(false);
    const [selectedConversationForDetail, setSelectedConversationForDetail] = useState(null);

    // Forms
    const [formLevel] = Form.useForm();
    const [formConv] = Form.useForm();
    const [formDict] = Form.useForm();

    // Watch participants để cập nhật dropdown speaker động
    const participantsWatch = Form.useWatch('participants', formConv) || [
        { id: 'P1', name: 'Người A' },
        { id: 'P2', name: 'Người B' }
    ];

    // HÀM HỖ TRỢ UPLOAD 
    const normFile = (e) => {
        if (Array.isArray(e)) {
            return e;
        }
        return e?.fileList;
    };

    // --- LOAD DATA TỪ BACKEND ---
    useEffect(() => {
        loadConversationConfig();
        loadConversationMetadata();
        loadDictionary();
        loadConversations();
        loadLevels();
    }, []);

    const loadConversationMetadata = async () => {
        try {
            const [topicsRes, levelsRes] = await Promise.all([
                adminService.getConversationTopics(),
                adminService.getConversationLevels()
            ]);

            if (topicsRes?.success && Array.isArray(topicsRes.data)) {
                setConversationTopics(topicsRes.data);
            }

            if (levelsRes?.success && Array.isArray(levelsRes.data)) {
                setConversationLevels(levelsRes.data);
            }
        } catch (error) {
            console.error('Load conversation metadata error:', error);
        }
    };

    // --- LOAD CONVERSATION CONFIG ---
    const loadConversationConfig = async () => {
        try {
            const response = await adminService.getConversationConfig();
            if (response.success && response.data) {
                setConversationConfig(response.data);
            }
        } catch (error) {
            console.error('Load conversation config error:', error);
            // Sử dụng default values nếu không load được
        }
    };

    const loadDictionary = async () => {
        try {
            setDictionaryLoading(true);
            const response = await adminService.getVocabularies({ isActive: true }, { page: 1, limit: 100 });

            if (response.success && response.data) {
                // Convert API data to match existing UI format
                const formattedData = response.data.map(vocab => {
                    return {
                        key: vocab._id,
                        word: vocab.displayWord || vocab.word,
                        type: vocab.type,
                        meaning: vocab.meaning,
                        family: vocab.wordFamily?.map(w => `${w.word} (${w.type})`).join(', ') || '',
                        synonyms: vocab.synonyms?.join(', ') || ''
                    };
                });
                // CRITICAL: Force new array reference to trigger React re-render
                setDictionary([...formattedData]);
                // Increment revision to force Table re-mount
                setTableRevision(prev => prev + 1);
            }
        } catch (error) {
            console.error('Load dictionary error:', error);
            message.error('Không thể tải danh sách từ vựng');
        } finally {
            setDictionaryLoading(false);
        }
    };

    // --- LOAD CONVERSATIONS TỪ BACKEND ---
    const loadConversations = async () => {
        try {
            setConversationsLoading(true);
            // Bỏ filter isActive để load tất cả conversations (admin/teacher cần thấy tất cả)
            const response = await adminService.getConversations(
                {},
                { page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }
            );

            // Response structure: { success: true, data: [...], pagination: {...} }
            if (response && response.success && Array.isArray(response.data)) {
                const formattedData = response.data.map(conv => ({
                    key: conv._id || conv.id,
                    _id: conv._id || conv.id,
                    title: conv.title,
                    level: conv.level,
                    topic: conv.topic,
                    count: conv.lines?.length || conv.totalLines || 0,
                    participants: conv.participants || [],
                    sentences: conv.lines || [],
                    description: conv.description || '',
                    tags: conv.tags || [],
                    isActive: conv.isActive !== undefined ? conv.isActive : true,
                    // Audio fields
                    audioGenerationStatus: conv.audioGenerationStatus || 'pending',
                    audioGenerationProgress: conv.audioGenerationProgress || 0,
                    audioGeneratedAt: conv.audioGeneratedAt,
                    lines: conv.lines || [],
                    voiceSettings: conv.voiceSettings
                }));
                setConversations(formattedData);
                // Audio status được lấy trực tiếp từ record, không cần gọi checkAudioStatus riêng
            } else {
                console.warn('Unexpected response format:', response);
                setConversations([]);
            }
        } catch (error) {
            console.error('Load conversations error:', error);
            console.error('Error details:', error.response?.data);
            message.error('Không thể tải danh sách hội thoại');
            setConversations([]);
        } finally {
            setConversationsLoading(false);
        }
    };

    // --- GENERATE AUDIO ---
    const handleGenerateAudio = (conversation) => {
        if (!conversation || !conversation._id) {
            console.error('Invalid conversation data:', conversation);
            message.error('Dữ liệu hội thoại không hợp lệ');
            return;
        }

        setSelectedConversationForAudio(conversation);
        setIsVoiceSettingsModal(true);
    };

    const handleConfirmVoiceSettings = async (voiceSettings) => {
        if (!selectedConversationForAudio) return;

        try {
            setIsVoiceSettingsModal(false);
            message.loading('Đang tạo voice...', 0);

            const response = await adminService.generateConversationAudio(
                selectedConversationForAudio._id,
                voiceSettings,
                true // useQueue
            );

            message.destroy();

            if (response.success) {
                message.success('Đã thêm vào queue. Audio đang được tạo...');

                // Reload ngay lập tức
                await loadConversations();

                // Start polling for status - check trực tiếp từ API
                const conversationId = selectedConversationForAudio._id;
                const pollInterval = setInterval(async () => {
                    try {
                        const statusResponse = await adminService.getConversationAudioStatus(conversationId);
                        if (statusResponse.success && statusResponse.data) {
                            const status = statusResponse.data.status;
                            if (status === 'completed' || status === 'failed' || status === 'partial') {
                                clearInterval(pollInterval);
                                await loadConversations(); // Final reload
                                if (status === 'completed') {
                                    message.success('Audio đã được tạo thành công!');
                                } else if (status === 'partial') {
                                    message.warning('Một số audio tạo thất bại');
                                } else {
                                    message.error('Tạo audio thất bại');
                                }
                            } else {
                                // Reload để cập nhật progress
                                await loadConversations();
                            }
                        }
                    } catch (err) {
                        console.error('Polling error:', err);
                    }
                }, 3000); // Poll every 3 seconds

                // Stop polling after 2 minutes
                setTimeout(() => {
                    clearInterval(pollInterval);
                    loadConversations();
                }, 120000);
            } else {
                message.error('Không thể tạo audio');
            }
        } catch (error) {
            message.destroy();
            console.error('Generate audio error:', error);
            message.error(error.response?.data?.message || 'Không thể tạo audio');
        } finally {
            setSelectedConversationForAudio(null);
        }
    };

    // --- LOAD LEVELS TỪ BACKEND ---
    const loadLevels = async () => {
        try {
            setLevelsLoading(true);
            const response = await adminService.getLevels(
                { isActive: true },
                { page: 1, limit: 100, sortBy: 'order', sortOrder: 'asc' }
            );

            if (response.success && response.data) {
                const formattedData = response.data.map(level => ({
                    key: level._id,
                    _id: level._id,
                    name: level.name,
                    code: level.code,
                    description: level.description,
                    order: level.order,
                    isActive: level.isActive
                }));
                setLevels(formattedData);
            }
        } catch (error) {
            console.error('Load levels error:', error);
            message.error('Không thể tải danh sách levels');
        } finally {
            setLevelsLoading(false);
        }
    };

    // HÀM CHUNG: XỬ LÝ MỞ MODAL 
    const openModal = (type, record = null) => {
        setEditingItem(record);
        if (type === 'level') {
            if (record) {
                formLevel.setFieldsValue({
                    name: record.name,
                    code: record.code,
                    description: record.description || '',
                    order: record.order || 0
                });
            } else {
                formLevel.resetFields();
            }
            setIsLevelModal(true);
        } else if (type === 'conv') {
            if (record) {
                // Map backend data sang form format
                const formData = {
                    title: record.title,
                    description: record.description,
                    topic: record.topic,
                    level: record.level,
                    participants: record.participants || [
                        { id: 'P1', name: 'Người A' },
                        { id: 'P2', name: 'Người B' }
                    ],
                    sentences: (record.sentences || record.lines || []).map(line => {
                        // Map speaker ID back to participant name for display
                        const participants = record.participants || [
                            { id: 'P1', name: 'Người A' },
                            { id: 'P2', name: 'Người B' }
                        ];

                        // Get speaker name: use speakerName if available, or map from speaker ID
                        let speakerName = line.speakerName || line.speaker;
                        if (line.speaker && line.speaker.length === 1) {
                            // Speaker is single letter (A, B, C...), map to participant name
                            const speakerIndex = line.speaker.charCodeAt(0) - 65; // 'A' = 0, 'B' = 1
                            if (speakerIndex >= 0 && speakerIndex < participants.length) {
                                speakerName = participants[speakerIndex].name;
                            }
                        }

                        return {
                            role: speakerName,
                            text: line.content
                        };
                    }),
                    tags: record.tags || [],
                    isActive: record.isActive !== undefined ? record.isActive : true
                };
                formConv.setFieldsValue(formData);
            } else {
                formConv.resetFields();
            }
            setIsConvModal(true);
        } else if (type === 'dict') {
            if (record) formDict.setFieldsValue(record); else formDict.resetFields();
            setIsDictModal(true);
        }
    };

    // FR-01: QUẢN LÝ LEVEL - SỬ DỤNG API
    const handleSaveLevel = async (values) => {
        try {
            setLevelsLoading(true);

            const levelData = {
                name: values.name,
                code: values.code || values.name.split(' ')[0].toUpperCase(),
                description: values.description || '',
                order: values.order || levels.length
            };

            if (editingItem && editingItem._id) {
                await adminService.updateLevel(editingItem._id, levelData);
                message.success('Cập nhật Level thành công');
            } else {
                await adminService.createLevel(levelData);
                message.success('Thêm Level thành công');
            }

            setIsLevelModal(false);
            formLevel.resetFields();
            setEditingItem(null);

            await loadLevels();
        } catch (error) {
            console.error('Save level error:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Không thể lưu level';
            message.error(errorMessage);
        } finally {
            setLevelsLoading(false);
        }
    };

    const handleDeleteLevel = async (key) => {
        try {
            setLevelsLoading(true);
            await adminService.deleteLevel(key);
            message.success('Đã xóa Level');
            await loadLevels();
        } catch (error) {
            console.error('Delete level error:', error);
            message.error('Không thể xóa level');
        } finally {
            setLevelsLoading(false);
        }
    };

    // Map Level name/code sang conversation level enum
    const mapLevelToConversationLevel = (levelName) => {
        if (!levelName) return 'beginner';

        const levelStr = levelName.toLowerCase();

        // Map từ Level code (A1, A2, B1, B2, C1, C2) sang conversation level
        if (levelStr.includes('a1') || levelStr.includes('a2') || levelStr.includes('sơ cấp') || levelStr.includes('beginner')) {
            return 'beginner';
        }
        if (levelStr.includes('b1') || levelStr.includes('b2') || levelStr.includes('trung cấp') || levelStr.includes('intermediate')) {
            return 'intermediate';
        }
        if (levelStr.includes('c1') || levelStr.includes('c2') || levelStr.includes('cao cấp') || levelStr.includes('advanced')) {
            return 'advanced';
        }

        // Fallback: kiểm tra nếu đã là enum value
        if (['beginner', 'intermediate', 'advanced'].includes(levelStr)) {
            return levelStr;
        }

        // Default
        return 'beginner';
    };

    // FR-02: QUẢN LÝ HỘI THOẠI - SỬ DỤNG API
    const handleSaveConv = async (values) => {
        try {
            setConversationsLoading(true);

            // Map form data sang format backend
            const conversationData = {
                title: values.title,
                description: values.description || '',
                topic: Array.isArray(values.topic) ? values.topic[0] : values.topic,
                level: mapLevelToConversationLevel(values.level),
                participants: values.participants || [
                    { id: 'P1', name: 'Người A' },
                    { id: 'P2', name: 'Người B' }
                ],
                lines: (values.sentences || []).map((sentence, index) => {
                    // Map speaker name to speaker ID (A, B, C...)
                    const speakerName = sentence.role || sentence.speaker || 'Người A';
                    const participants = values.participants || [
                        { id: 'P1', name: 'Người A' },
                        { id: 'P2', name: 'Người B' }
                    ];

                    // Find participant index and convert to A, B, C...
                    const participantIndex = participants.findIndex(p => p.name === speakerName);
                    const speakerId = participantIndex >= 0
                        ? String.fromCharCode(65 + participantIndex) // 65 = 'A'
                        : 'A'; // Default to A

                    return {
                        speaker: speakerId, // 'A', 'B', 'C'...
                        speakerName: speakerName, // 'Người A', 'John', etc. for display
                        content: sentence.text || sentence.content || '',
                        order: index + 1
                    };
                }),
                tags: values.tags || [],
                isActive: values.isActive !== undefined ? values.isActive : true
            };

            if (editingItem && editingItem._id) {
                await adminService.updateConversation(editingItem._id, conversationData);
                message.success('Cập nhật hội thoại thành công');
            } else {
                await adminService.createConversation(conversationData);
                message.success('Tạo hội thoại thành công');
            }

            setIsConvModal(false);
            formConv.resetFields();
            setEditingItem(null);

            // Reload conversations ngay lập tức và sau đó reload lại sau delay
            await loadConversations();
            setTimeout(async () => {
                await loadConversations();
            }, 500);
        } catch (error) {
            console.error('Save conversation error:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Không thể lưu hội thoại';
            message.error(errorMessage);
        } finally {
            setConversationsLoading(false);
        }
    };

    const handleDeleteConv = async (key) => {
        try {
            setConversationsLoading(true);
            await adminService.deleteConversation(key);
            message.success('Đã xóa hội thoại');
            // Reload conversations với delay nhỏ
            setTimeout(async () => {
                await loadConversations();
            }, 300);
        } catch (error) {
            console.error('Delete conversation error:', error);
            message.error('Không thể xóa hội thoại');
        } finally {
            setConversationsLoading(false);
        }
    };

    //FR-03: QUẢN LÝ TỪ ĐIỂN - SỬ DỤNG API
    const handleSaveDict = async (values) => {
        try {
            // Map từ viết tắt sang tên đầy đủ
            const typeMap = {
                'n': 'noun',
                'noun': 'noun',
                'v': 'verb',
                'verb': 'verb',
                'adj': 'adjective',
                'adjective': 'adjective',
                'adv': 'adverb',
                'adverb': 'adverb'
            };

            // Prepare data for API
            const vocabularyData = {
                word: values.word,
                type: values.type,
                meaning: values.meaning,
                synonyms: values.synonyms ? values.synonyms.split(',').map(s => s.trim()).filter(s => s) : [],
                wordFamily: values.family ? values.family.split(',').map(f => {
                    const match = f.trim().match(/(.+?)\s*\((.+?)\)/);
                    if (match) {
                        const word = match[1].trim();
                        const typeAbbr = match[2].trim().toLowerCase();
                        const fullType = typeMap[typeAbbr] || 'other';
                        return { word, type: fullType, meaning: '' };
                    }
                    return { word: f.trim(), type: 'other', meaning: '' };
                }).filter(item => item.word) : []
            };

            if (editingItem) {
                await adminService.updateVocabulary(editingItem.key, vocabularyData);
                message.success('Cập nhật từ vựng thành công');
            } else {
                await adminService.createVocabulary(vocabularyData);
                message.success('Thêm từ mới thành công');
            }

            // Close modal and reset form FIRST
            setIsDictModal(false);
            formDict.resetFields();
            setEditingItem(null);

            // CRITICAL: Force reload with small delay to ensure modal closes
            setTimeout(async () => {
                await loadDictionary();
            }, 100);

        } catch (error) {
            console.error('Save vocabulary error:', error);
            message.error(error.response?.data?.error || 'Không thể lưu từ vựng');
        }
    };

    const handleDeleteDict = async (key) => {
        try {
            await adminService.deleteVocabulary(key);
            message.success('Đã xóa từ vựng');

            // CRITICAL: Force reload with delay to ensure Popconfirm closes
            setTimeout(async () => {
                await loadDictionary();
            }, 100);
        } catch (error) {
            console.error('Delete vocabulary error:', error);
            message.error('Không thể xóa từ vựng');
        }
    };

    return (
        <Card title="Chức năng Giáo viên (Teacher Modules)" bordered={false}>
            <Tabs type="card" items={[
                {
                    key: '1', label: <span><BarsOutlined /> Danh mục Level</span>,
                    children: (
                        <>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('level')} style={{ marginBottom: 16 }}>Thêm Level</Button>
                            <Spin spinning={levelsLoading}>
                                <Table scroll={{ x: 'max-content' }} dataSource={levels} rowKey="key" columns={[
                                    { title: 'Mã', dataIndex: 'code', width: 100 },
                                    { title: 'Tên Level', dataIndex: 'name' },
                                    {
                                        title: 'Hành động', width: 150, render: (_, r) => (
                                            <Space>
                                                <Button icon={<EditOutlined />} size="small" onClick={() => openModal('level', r)} />
                                                <Popconfirm title="Xóa level này?" onConfirm={() => handleDeleteLevel(r.key)}>
                                                    <Button danger size="small" icon={<DeleteOutlined />} />
                                                </Popconfirm>
                                            </Space>
                                        )
                                    }
                                ]} pagination={false} />
                            </Spin>
                            <Modal title={editingItem ? "Sửa Level" : "Thêm Level Mới"} open={isLevelModal} onCancel={() => setIsLevelModal(false)} onOk={() => formLevel.submit()}>
                                <Form form={formLevel} layout="vertical" onFinish={handleSaveLevel}>
                                    <Form.Item name="name" label="Tên Level" rules={[{ required: true, message: 'Vui lòng nhập tên Level' }]}>
                                        <Input placeholder="VD: A1 (Sơ cấp)" />
                                    </Form.Item>
                                    <Form.Item name="code" label="Mã Level" rules={[{ required: true, message: 'Vui lòng nhập mã Level' }]}>
                                        <Input placeholder="VD: A1" style={{ textTransform: 'uppercase' }} />
                                    </Form.Item>
                                    <Form.Item name="description" label="Mô tả">
                                        <Input.TextArea rows={2} placeholder="Mô tả về level này..." />
                                    </Form.Item>
                                    <Form.Item name="order" label="Thứ tự">
                                        <InputNumber min={0} placeholder="Thứ tự hiển thị" style={{ width: '100%' }} />
                                    </Form.Item>
                                </Form>
                            </Modal>
                        </>
                    )
                },
                {
                    key: '2', label: <span><MessageOutlined /> Quản lý Hội thoại</span>,
                    children: (
                        <>
                            <Space style={{ marginBottom: 16 }}>
                                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('conv')} style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}>Tạo bài hội thoại</Button>
                                <Button icon={<ReloadOutlined />} onClick={loadConversations} loading={conversationsLoading}>Làm mới</Button>
                            </Space>
                            <Spin spinning={conversationsLoading}>
                                <Table scroll={{ x: 'max-content' }} dataSource={conversations} rowKey="key" columns={[
                                    { title: 'Media', dataIndex: 'media', width: 80, render: src => src ? <Image src={src} width={50} /> : <VideoCameraOutlined style={{ fontSize: 24, color: '#ccc' }} /> },
                                    { title: 'Tiêu đề', dataIndex: 'title', render: t => <b>{t}</b> },
                                    { title: 'Level', dataIndex: 'level', render: t => <Tag color="blue">{t}</Tag> },
                                    { title: 'Chủ đề', dataIndex: 'topic' },
                                    { title: 'Số câu', dataIndex: 'count', align: 'center' },
                                    {
                                        title: 'Trạng thái Audio',
                                        width: 150,
                                        render: (_, record) => {
                                            // Lấy trực tiếp từ record data (đã load từ API)
                                            const statusValue = record.audioGenerationStatus || 'pending';
                                            const progress = record.audioGenerationProgress || 0;

                                            // Đếm số lines có audio
                                            const totalLines = record.lines?.length || 0;
                                            const linesWithAudio = (record.lines || []).filter(
                                                l => l.audioUrl && l.audioStatus === 'completed'
                                            ).length;

                                            const getStatusIcon = () => {
                                                switch (statusValue) {
                                                    case 'completed':
                                                        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
                                                    case 'partial':
                                                        return <CheckCircleOutlined style={{ color: '#faad14' }} />;
                                                    case 'generating':
                                                    case 'in_progress':
                                                    case 'queued':
                                                        return <Spin size="small" />;
                                                    case 'failed':
                                                        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
                                                    default:
                                                        return null;
                                                }
                                            };

                                            const getStatusText = () => {
                                                switch (statusValue) {
                                                    case 'completed':
                                                        return 'Hoàn thành';
                                                    case 'partial':
                                                        return 'Một phần';
                                                    case 'generating':
                                                    case 'in_progress':
                                                        return 'Đang tạo...';
                                                    case 'queued':
                                                        return 'Đang chờ...';
                                                    case 'failed':
                                                        return 'Thất bại';
                                                    default:
                                                        return 'Chưa tạo';
                                                }
                                            };

                                            // Tính progress thực tế từ số lines có audio
                                            const actualProgress = totalLines > 0
                                                ? Math.round((linesWithAudio / totalLines) * 100)
                                                : progress;

                                            return (
                                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                                    <Space>
                                                        {getStatusIcon()}
                                                        <span style={{ fontSize: 12 }}>{getStatusText()}</span>
                                                    </Space>
                                                    {(statusValue === 'generating' || statusValue === 'in_progress' || statusValue === 'queued') ? (
                                                        <Progress
                                                            percent={actualProgress}
                                                            size="small"
                                                            status="active"
                                                        />
                                                    ) : statusValue === 'completed' || statusValue === 'partial' ? (
                                                        <Tag color={actualProgress === 100 ? 'success' : 'warning'}>
                                                            {linesWithAudio}/{totalLines} câu
                                                        </Tag>
                                                    ) : null}
                                                </Space>
                                            );
                                        }
                                    },
                                    {
                                        title: 'Audio',
                                        width: 130,
                                        render: (_, record) => {
                                            // Count audio stats for ALL lines
                                            const totalLines = record.lines?.length || 0;
                                            const linesWithAudio = (record.lines || []).filter(
                                                l => l.audioUrl && l.audioStatus === 'completed'
                                            ).length;
                                            const progress = totalLines > 0 ? Math.round((linesWithAudio / totalLines) * 100) : 0;

                                            // Get first line with audio for preview
                                            const firstLineWithAudio = record.lines?.find(line =>
                                                line.audioUrl && line.audioStatus === 'completed'
                                            );

                                            return (
                                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                                    {firstLineWithAudio?.audioUrl && (
                                                        <AudioPlayer
                                                            audioUrl={
                                                                firstLineWithAudio.audioUrl.startsWith('http')
                                                                    ? firstLineWithAudio.audioUrl
                                                                    : `${process.env.REACT_APP_PYTHON_API_URL || 'http://localhost:8000'}${firstLineWithAudio.audioUrl}`
                                                            }
                                                            size="small"
                                                            showProgress={false}
                                                        />
                                                    )}
                                                    <Tag
                                                        color={progress === 100 ? 'success' : progress > 0 ? 'processing' : 'default'}
                                                        style={{ cursor: 'pointer', fontSize: 11 }}
                                                        onClick={() => {
                                                            setSelectedConversationForDetail(record);
                                                            setIsConversationDetailModal(true);
                                                        }}
                                                    >
                                                        {linesWithAudio}/{totalLines} cau ({progress}%)
                                                    </Tag>
                                                </Space>
                                            );
                                        }
                                    },
                                    {
                                        title: 'Action',
                                        width: 200,
                                        render: (_, r) => (
                                            <Space wrap>
                                                <Tooltip title="View details">
                                                    <Button
                                                        icon={<InfoCircleOutlined />}
                                                        size="small"
                                                        onClick={() => {
                                                            setSelectedConversationForDetail(r);
                                                            setIsConversationDetailModal(true);
                                                        }}
                                                    />
                                                </Tooltip>
                                                <Tooltip title="Edit">
                                                    <Button icon={<EditOutlined />} size="small" onClick={() => openModal('conv', r)} />
                                                </Tooltip>
                                                <Tooltip title="Create/ update Audio">
                                                    <Button
                                                        icon={<SoundOutlined />}
                                                        size="small"
                                                        onClick={() => handleGenerateAudio(r)}
                                                        type={r.audioGenerationStatus === 'completed' ? 'default' : 'primary'}
                                                    />
                                                </Tooltip>
                                                <Popconfirm title="Delete conversation?" onConfirm={() => handleDeleteConv(r.key)}>
                                                    <Tooltip title="Delete">
                                                        <Button danger size="small" icon={<DeleteOutlined />} />
                                                    </Tooltip>
                                                </Popconfirm>
                                            </Space>
                                        )
                                    }
                                ]} pagination={{ pageSize: 10 }} />
                            </Spin>

                            <Modal
                                title={editingItem ? "Chỉnh sửa Hội thoại" : "Tạo Hội thoại mới"}
                                width={850}
                                open={isConvModal}
                                onCancel={() => setIsConvModal(false)}
                                footer={null}
                                style={{ top: 20 }}
                            >
                                <div
                                    className="modal-scroll-container"
                                    style={{
                                        maxHeight: 'calc(100vh - 200px)',
                                        overflowY: 'auto',
                                        overflowX: 'hidden',
                                        paddingRight: 8,
                                        scrollbarWidth: 'none',
                                        msOverflowStyle: 'none'
                                    }}
                                    onWheel={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    <Alert message={`Hệ thống tự động hiển thị số dòng tương ứng với số câu bạn thêm (Tối đa ${conversationConfig.maxLines} câu).`} type="info" showIcon style={{ marginBottom: 16 }} />
                                    <Form form={formConv} layout="vertical" onFinish={handleSaveConv}>
                                        <Card size="small" title="Thông tin chung & Media" style={{ marginBottom: 16 }}>
                                            <Space align="start" size="large" style={{ display: 'flex' }}>
                                                <div style={{ flex: 1 }}>
                                                    <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
                                                        <Input placeholder="VD: At the Coffee Shop" />
                                                    </Form.Item>
                                                    <Space>
                                                        <Form.Item name="level" label="Level" rules={[{ required: true, message: 'Chọn Level' }]} style={{ width: 200 }}>
                                                            <Select placeholder="Chọn level">
                                                                {(conversationLevels.length > 0 ? conversationLevels : [
                                                                    { value: 'beginner', label: 'Cơ bản' },
                                                                    { value: 'intermediate', label: 'Trung cấp' },
                                                                    { value: 'advanced', label: 'Nâng cao' }
                                                                ]).map(level => (
                                                                    <Option key={level.value} value={level.value}>
                                                                        {level.label}
                                                                    </Option>
                                                                ))}
                                                            </Select>
                                                        </Form.Item>
                                                        <Form.Item name="topic" label="Chủ đề" rules={[{ required: true, message: 'Chọn hoặc nhập chủ đề' }]} style={{ width: 200 }}>
                                                            <Select
                                                                mode="tags"
                                                                placeholder="Chọn hoặc nhập chủ đề"
                                                                maxTagCount={1}
                                                                tokenSeparators={[',']}
                                                            >
                                                                {conversationTopics.map(topic => (
                                                                    <Option key={topic.name} value={topic.name}>
                                                                        {topic.name}
                                                                    </Option>
                                                                ))}
                                                            </Select>
                                                        </Form.Item>
                                                    </Space>
                                                </div>
                                                <div style={{ width: 200 }}>
                                                    {/* */}
                                                    <Form.Item
                                                        name="media"
                                                        label="Hình ảnh / Video minh họa"
                                                        valuePropName="fileList"
                                                        getValueFromEvent={normFile} //  Hàm chuyển đổi dữ liệu
                                                    >
                                                        <Upload
                                                            name="logo"
                                                            listType="picture"
                                                            maxCount={1}
                                                            beforeUpload={() => false} // <--- Ngăn không cho upload tự động lên server (Tránh lỗi 404)
                                                        >
                                                            <Button icon={<UploadOutlined />}>Tải lên Media</Button>
                                                        </Upload>
                                                    </Form.Item>
                                                </div>
                                            </Space>
                                        </Card>

                                        <Card size="small" title={`Người tham gia hội thoại (${conversationConfig.minParticipants}-${conversationConfig.maxParticipants} người)`} style={{ marginBottom: 16 }}>
                                            <Form.List
                                                name="participants"
                                                initialValue={[
                                                    { id: 'P1', name: 'Người A' },
                                                    { id: 'P2', name: 'Người B' }
                                                ]}
                                            >
                                                {(fields, { add, remove }) => (
                                                    <>
                                                        <Space wrap style={{ marginBottom: 8 }}>
                                                            {fields.map(({ key, name, ...restField }) => (
                                                                <Space key={key} align="center">
                                                                    <Form.Item
                                                                        {...restField}
                                                                        name={[name, 'name']}
                                                                        rules={[{ required: true, message: 'Nhập tên' }]}
                                                                        style={{ marginBottom: 0 }}
                                                                    >
                                                                        <Input
                                                                            placeholder={`Tên người ${name + 1}`}
                                                                            style={{ width: 120 }}
                                                                            prefix={<span style={{ color: '#1890ff', fontWeight: 'bold' }}>{name + 1}.</span>}
                                                                        />
                                                                    </Form.Item>
                                                                    <Form.Item name={[name, 'id']} hidden><Input /></Form.Item>
                                                                    {fields.length > conversationConfig.minParticipants && (
                                                                        <Button
                                                                            type="text"
                                                                            danger
                                                                            size="small"
                                                                            icon={<DeleteOutlined />}
                                                                            onClick={() => remove(name)}
                                                                        />
                                                                    )}
                                                                </Space>
                                                            ))}
                                                        </Space>
                                                        {fields.length < conversationConfig.maxParticipants && (
                                                            <Button
                                                                type="dashed"
                                                                size="small"
                                                                onClick={() => add({ id: `P${fields.length + 1}`, name: '' })}
                                                                icon={<PlusOutlined />}
                                                            >
                                                                Thêm người ({fields.length}/5)
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                            </Form.List>
                                        </Card>

                                        <Card size="small" title="Nội dung hội thoại">
                                            <Form.List name="sentences">
                                                {(fields, { add, remove }) => (
                                                    <>
                                                        {fields.map(({ key, name, ...restField }, index) => (
                                                            <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="start">
                                                                <div style={{ paddingTop: 8, fontWeight: 'bold', width: 30 }}>#{index + 1}</div>
                                                                <Form.Item {...restField} name={[name, 'role']} rules={[{ required: true, message: 'Chọn người nói' }]}>
                                                                    <Select style={{ width: 120 }} placeholder="Người nói">
                                                                        {participantsWatch.map((p, idx) => (
                                                                            <Option key={p.id || `P${idx + 1}`} value={p.name || `Người ${idx + 1}`}>
                                                                                {p.name || `Người ${idx + 1}`}
                                                                            </Option>
                                                                        ))}
                                                                    </Select>
                                                                </Form.Item>
                                                                <Form.Item {...restField} name={[name, 'text']} rules={[{ required: true, message: 'Nhập nội dung' }]}>
                                                                    <Input style={{ width: 480 }} placeholder="Nội dung câu thoại..." />
                                                                </Form.Item>
                                                                <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                                            </Space>
                                                        ))}
                                                        {fields.length < conversationConfig.maxLines ? (
                                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginTop: 8 }}>
                                                                Thêm câu thoại ({fields.length}/{conversationConfig.maxLines})
                                                            </Button>
                                                        ) : <Alert message={`Đã đạt giới hạn ${conversationConfig.maxLines} câu.`} type="warning" showIcon style={{ marginTop: 8 }} />}
                                                    </>
                                                )}
                                            </Form.List>
                                        </Card>
                                        <div style={{ textAlign: 'right', marginTop: 16 }}>
                                            <Space>
                                                <Button onClick={() => setIsConvModal(false)}>Hủy</Button>
                                                <Button type="primary" htmlType="submit">Lưu bài học</Button>
                                            </Space>
                                        </div>
                                    </Form>
                                </div>
                            </Modal>
                        </>
                    )
                },
                {
                    key: '3', label: <span><BookOutlined /> Quản lý Từ điển</span>,
                    children: (
                        <>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('dict')} style={{ marginBottom: 16 }}>Thêm từ mới</Button>
                            <Spin spinning={dictionaryLoading}>
                                <Table
                                    dataSource={dictionary}
                                    rowKey="key"
                                    key={`vocab-table-rev-${tableRevision}`}
                                    columns={[
                                        { title: 'Từ vựng', dataIndex: 'word', render: t => <b style={{ color: '#d4380d' }}>{t}</b> },
                                        { title: 'Loại từ', dataIndex: 'type', render: t => <Tag>{t}</Tag> },
                                        { title: 'Nghĩa', dataIndex: 'meaning' },
                                        { title: 'Gia đình từ', dataIndex: 'family', render: t => t ? t : <i style={{ color: '#ccc' }}>Không có</i> },
                                        {
                                            title: 'Hành động', width: 120, render: (_, r) => (
                                                <Space>
                                                    <Button icon={<EditOutlined />} size="small" onClick={() => openModal('dict', r)} />
                                                    <Popconfirm title="Xóa từ này?" onConfirm={() => handleDeleteDict(r.key)}>
                                                        <Button danger size="small" icon={<DeleteOutlined />} />
                                                    </Popconfirm>
                                                </Space>
                                            )
                                        }
                                    ]}
                                />
                            </Spin>

                            <Modal title={editingItem ? "Sửa từ vựng" : "Thêm từ vựng mới"} open={isDictModal} onCancel={() => setIsDictModal(false)} onOk={() => formDict.submit()}>
                                <Form form={formDict} layout="vertical" onFinish={handleSaveDict}>
                                    <Space size="large" style={{ display: 'flex' }}>
                                        <Form.Item name="word" label="Từ vựng" rules={[{ required: true, message: 'Nhập từ' }]} style={{ flex: 1 }}>
                                            <Input placeholder="VD: Learn" />
                                        </Form.Item>
                                        <Form.Item name="type" label="Loại từ" rules={[{ required: true, message: 'Chọn loại' }]} style={{ width: 120 }}>
                                            <Select><Option value="noun">Noun (n)</Option><Option value="verb">Verb (v)</Option><Option value="adj">Adj</Option><Option value="adv">Adv</Option></Select>
                                        </Form.Item>
                                    </Space>
                                    <Form.Item name="meaning" label="Giải thích ý nghĩa" rules={[{ required: true, message: 'Nhập ý nghĩa' }]}>
                                        <Input.TextArea rows={2} placeholder="Giải thích nghĩa của từ..." />
                                    </Form.Item>
                                    <Form.Item name="synonyms" label="Đồng nghĩa / Trái nghĩa">
                                        <Input placeholder="VD: Study (Synonym) / Teach (Antonym)" />
                                    </Form.Item>
                                    <Form.Item name="family" label="Gia đình từ (Word Family)" tooltip="Ví dụ: Learn (v) -> Learner (n)">
                                        <Input placeholder="VD: Learn (v) -> Learner (n), Learning (adj)" />
                                    </Form.Item>
                                </Form>
                            </Modal>

                        </>
                    )
                }
            ]} />

            {/* Voice Settings Modal - cau hinh voice cho tung participant */}
            <VoiceSettingsModal
                open={isVoiceSettingsModal}
                onCancel={() => {
                    setIsVoiceSettingsModal(false);
                    setSelectedConversationForAudio(null);
                }}
                onConfirm={handleConfirmVoiceSettings}
                conversation={selectedConversationForAudio}
                initialSettings={selectedConversationForAudio?.voiceSettings}
            />

            {/* Conversation Detail Modal - xem noi dung va nghe audio */}
            <ConversationDetailModal
                open={isConversationDetailModal}
                onClose={() => {
                    setIsConversationDetailModal(false);
                    setSelectedConversationForDetail(null);
                }}
                conversation={selectedConversationForDetail}
                onGenerateAudio={() => {
                    setIsConversationDetailModal(false);
                    if (selectedConversationForDetail) {
                        handleGenerateAudio(selectedConversationForDetail);
                    }
                }}
            />
        </Card >
    );
};
export default TeacherModules;