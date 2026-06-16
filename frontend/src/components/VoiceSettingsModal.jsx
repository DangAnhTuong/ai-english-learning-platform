import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Select, InputNumber, Space, Button, Alert, Divider, Tag, Typography, Row, Col, Collapse } from 'antd';
import { SoundOutlined, PlayCircleOutlined, UserOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { adminService } from '../services/adminService';
import { message } from 'antd';

const { Option } = Select;
const { Text } = Typography;

// Default voices khi không load được từ API
const DEFAULT_VOICES = {
    openai: [
        { id: 'alloy', name: 'Alloy', gender: 'neutral', description: 'Cân bằng, tự nhiên' },
        { id: 'echo', name: 'Echo', gender: 'male', description: 'Rõ ràng, chuyên nghiệp' },
        { id: 'fable', name: 'Fable', gender: 'male', description: 'Biểu cảm, kể chuyện' },
        { id: 'onyx', name: 'Onyx', gender: 'male', description: 'Trầm, uy quyền' },
        { id: 'nova', name: 'Nova', gender: 'female', description: 'Tươi sáng, năng động' },
        { id: 'shimmer', name: 'Shimmer', gender: 'female', description: 'Nhẹ nhàng, dịu dàng' }
    ],
    deepgram: []
};

/**
 * Voice Settings Modal - Cấu hình voice cho TỪNG participant
 */
const VoiceSettingsModal = ({
    open,
    onCancel,
    onConfirm,
    conversation,
    initialSettings = null
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [voices, setVoices] = useState(DEFAULT_VOICES);
    const [providers, setProviders] = useState(['openai']);
    const [previewingParticipant, setPreviewingParticipant] = useState(null);
    const [formValues, setFormValues] = useState({});
    const audioRef = useRef(null);

    const participants = conversation?.participants || [];

    useEffect(() => {
        if (open && participants.length > 0) {
            loadVoices();
            initializeForm();
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [open, conversation]);

    const initializeForm = () => {
        const values = {};
        participants.forEach((participant, index) => {
            const participantKey = participant.id || `P${index + 1}`;
            const savedSettings = initialSettings?.[participantKey];
            const suggestedVoice = getSuggestedVoice(index);

            values[`${participantKey}_provider`] = savedSettings?.provider || 'openai';
            values[`${participantKey}_voice`] = savedSettings?.voice || suggestedVoice;
            values[`${participantKey}_speed`] = savedSettings?.speed || 1.0;
        });
        setFormValues(values);
        form.setFieldsValue(values);
    };

    const getSuggestedVoice = (index) => {
        const voiceOptions = ['alloy', 'echo', 'nova', 'fable', 'shimmer', 'onyx'];
        return voiceOptions[index % voiceOptions.length];
    };

    const loadVoices = async () => {
        try {
            const response = await adminService.getAvailableVoices();
            if (response.success && response.data) {
                setVoices({
                    openai: response.data.openai || DEFAULT_VOICES.openai,
                    deepgram: response.data.deepgram || []
                });
                setProviders(response.data.providers || ['openai']);
            }
        } catch (error) {
            console.error('Load voices error:', error);
            setVoices(DEFAULT_VOICES);
            setProviders(['openai']);
        }
    };

    const handlePreview = async (participantId) => {
        const provider = formValues[`${participantId}_provider`] || 'openai';
        const voice = formValues[`${participantId}_voice`];
        const speed = formValues[`${participantId}_speed`] || 1.0;

        if (!voice) {
            message.warning('Vui lòng chọn giọng đọc trước');
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
            if (previewingParticipant === participantId) {
                setPreviewingParticipant(null);
                audioRef.current = null;
                return;
            }
        }

        setPreviewingParticipant(participantId);

        try {
            const response = await adminService.previewVoice({
                text: "Xin chào, đây là bản xem trước giọng đọc.",
                provider,
                voice,
                speed
            });

            if (response.success && response.data?.audioUrl) {
                const audioUrl = response.data.audioUrl.startsWith('http')
                    ? response.data.audioUrl
                    : `${process.env.REACT_APP_PYTHON_API_URL || 'http://localhost:8000'}${response.data.audioUrl}`;

                audioRef.current = new Audio(audioUrl);
                audioRef.current.onended = () => setPreviewingParticipant(null);
                audioRef.current.onerror = () => {
                    message.error('Không thể phát audio preview');
                    setPreviewingParticipant(null);
                };
                audioRef.current.play();
            } else {
                message.info('Tính năng preview đang được phát triển');
                setPreviewingParticipant(null);
            }
        } catch (error) {
            console.error('Preview error:', error);
            message.info('Preview chưa khả dụng');
            setPreviewingParticipant(null);
        }
    };

    const handleConfirm = () => {
        form.validateFields().then(values => {
            const voiceSettings = {};
            participants.forEach((participant, index) => {
                const participantKey = participant.id || `P${index + 1}`;
                voiceSettings[participantKey] = {
                    provider: values[`${participantKey}_provider`],
                    voice: values[`${participantKey}_voice`],
                    speed: values[`${participantKey}_speed`] || 1.0,
                    participantName: participant.name
                };
            });
            onConfirm(voiceSettings);
        });
    };

    const handleProviderChange = (participantId, provider) => {
        form.setFieldValue(`${participantId}_voice`, null);
        setFormValues(prev => ({
            ...prev,
            [`${participantId}_provider`]: provider,
            [`${participantId}_voice`]: null
        }));
    };

    const handleFieldChange = (field, value) => {
        setFormValues(prev => ({ ...prev, [field]: value }));
    };

    // Build Collapse items
    const collapseItems = participants.map((participant, index) => {
        const participantKey = participant.id || `P${index + 1}`;
        const currentProvider = formValues[`${participantKey}_provider`] || 'openai';
        const availableVoices = voices[currentProvider] || voices.openai;

        return {
            key: index.toString(),
            label: (
                <Space>
                    <UserOutlined />
                    <Text strong>{participant.name}</Text>
                    <Tag color={index === 0 ? 'green' : index === 1 ? 'blue' : 'purple'}>
                        {participantKey}
                    </Tag>
                </Space>
            ),
            children: (
                <Row gutter={[16, 8]}>
                    <Col span={8}>
                        <Form.Item
                            name={`${participantKey}_provider`}
                            label="Provider"
                            rules={[{ required: true, message: 'Chọn provider' }]}
                        >
                            <Select
                                placeholder="Chọn provider"
                                onChange={(v) => handleProviderChange(participantKey, v)}
                            >
                                {providers.map(p => (
                                    <Option key={p} value={p}>
                                        {p === 'openai' ? 'OpenAI TTS' : 'Deepgram'}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={10}>
                        <Form.Item
                            name={`${participantKey}_voice`}
                            label="Giọng đọc"
                            rules={[{ required: true, message: 'Chọn giọng đọc' }]}
                        >
                            <Select
                                placeholder="Chọn giọng đọc"
                                showSearch
                                onChange={(v) => handleFieldChange(`${participantKey}_voice`, v)}
                            >
                                {availableVoices.map(voice => (
                                    <Option key={voice.id} value={voice.id}>
                                        <Space size={4}>
                                            <span>{voice.name}</span>
                                            <Tag
                                                color={voice.gender === 'male' ? 'blue' : voice.gender === 'female' ? 'pink' : 'default'}
                                                style={{ fontSize: 10 }}
                                            >
                                                {voice.gender === 'male' ? 'Nam' : voice.gender === 'female' ? 'Nữ' : 'Trung tính'}
                                            </Tag>
                                        </Space>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item
                            name={`${participantKey}_speed`}
                            label="Tốc độ"
                            rules={[{ required: true, message: 'Nhập tốc độ' }]}
                        >
                            <InputNumber
                                min={0.5}
                                max={2.0}
                                step={0.1}
                                style={{ width: '100%' }}
                                onChange={(v) => handleFieldChange(`${participantKey}_speed`, v)}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Button
                            size="small"
                            icon={previewingParticipant === participantKey ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                            onClick={() => handlePreview(participantKey)}
                            type={previewingParticipant === participantKey ? 'primary' : 'default'}
                        >
                            {previewingParticipant === participantKey ? 'Đang phát...' : 'Nghe thử'}
                        </Button>
                    </Col>
                </Row>
            )
        };
    });

    return (
        <Modal
            title={
                <Space>
                    <SoundOutlined />
                    <span>Cấu hình Giọng đọc cho từng Nhân vật</span>
                </Space>
            }
            open={open}
            onCancel={onCancel}
            onOk={handleConfirm}
            confirmLoading={loading}
            width={720}
            okText="Xác nhận & Tạo Audio"
            cancelText="Hủy"
            centered
            destroyOnClose
        >
            <Form form={form} layout="vertical" initialValues={formValues}>
                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                    message={
                        <Text strong>Cấu hình giọng đọc riêng cho từng nhân vật</Text>
                    }
                    description="Mỗi nhân vật có thể có giọng đọc khác nhau. Audio sẽ được tạo cho TẤT CẢ các câu hội thoại."
                />

                {participants.length === 0 ? (
                    <Alert
                        type="warning"
                        showIcon
                        message={<Text strong>Chưa có nhân vật</Text>}
                        description="Hội thoại chưa có thông tin về người tham gia."
                    />
                ) : (
                    <Collapse
                        defaultActiveKey={participants.map((_, i) => i.toString())}
                        items={collapseItems}
                        style={{ marginBottom: 16 }}
                    />
                )}

                <Divider style={{ margin: '16px 0' }} />

                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    <strong>Lưu ý:</strong> Mỗi nhân vật nên có giọng đọc khác nhau để phân biệt.
                    Sử dụng các giọng khác giới tính (nam/nữ) để tăng tính tự nhiên.
                </Text>
            </Form>
        </Modal>
    );
};

export default VoiceSettingsModal;
