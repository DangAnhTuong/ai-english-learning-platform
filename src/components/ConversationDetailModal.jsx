import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Space, Tag, Progress, Typography, Empty, Tooltip, Card, Divider, Descriptions, Badge } from 'antd';
import {
    PlayCircleOutlined,
    PauseCircleOutlined,
    SoundOutlined,
    UserOutlined,
    DownloadOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

/**
 * Modal xem chi tiết nội dung hội thoại và nghe audio
 */
const ConversationDetailModal = ({
    open,
    onClose,
    conversation,
    onGenerateAudio
}) => {
    const [playingLineId, setPlayingLineId] = useState(null);
    const [audioProgress, setAudioProgress] = useState({});
    const [playAllMode, setPlayAllMode] = useState(false);
    const [currentPlayIndex, setCurrentPlayIndex] = useState(0);
    const audioRefs = useRef({});
    const playAllRef = useRef(false);

    const PYTHON_API_URL = process.env.REACT_APP_PYTHON_API_URL || 'http://localhost:8000';

    // Participants map for quick lookup
    const participantMap = {};
    (conversation?.participants || []).forEach((p, index) => {
        participantMap[p.name] = {
            id: p.id || `P${index + 1}`,
            color: index === 0 ? '#52c41a' : index === 1 ? '#1890ff' : '#722ed1',
            bgColor: index === 0 ? '#f6ffed' : index === 1 ? '#e6f7ff' : '#f9f0ff'
        };
    });

    const allLines = conversation?.lines || [];
    const linesWithAudio = allLines.filter(l => l.audioUrl && l.audioStatus === 'completed');

    useEffect(() => {
        if (!open) {
            stopAllAudio();
            setPlayAllMode(false);
            playAllRef.current = false;
        }
    }, [open]);

    const stopAllAudio = () => {
        Object.values(audioRefs.current).forEach(audio => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        setPlayingLineId(null);
        setAudioProgress({});
    };

    const getFullAudioUrl = (audioUrl) => {
        if (!audioUrl) return null;
        if (audioUrl.startsWith('http')) return audioUrl;
        return `${PYTHON_API_URL}${audioUrl}`;
    };

    const handlePlay = (lineId, audioUrl) => {
        if (playingLineId && audioRefs.current[playingLineId]) {
            audioRefs.current[playingLineId].pause();
            audioRefs.current[playingLineId].currentTime = 0;
        }

        if (playingLineId === lineId) {
            setPlayingLineId(null);
            return;
        }

        const fullUrl = getFullAudioUrl(audioUrl);
        if (!fullUrl) return;

        if (!audioRefs.current[lineId]) {
            audioRefs.current[lineId] = new Audio(fullUrl);

            audioRefs.current[lineId].addEventListener('timeupdate', () => {
                const audio = audioRefs.current[lineId];
                if (audio && audio.duration) {
                    const progress = (audio.currentTime / audio.duration) * 100;
                    setAudioProgress(prev => ({ ...prev, [lineId]: progress }));
                }
            });

            audioRefs.current[lineId].addEventListener('ended', () => {
                setPlayingLineId(null);
                setAudioProgress(prev => ({ ...prev, [lineId]: 0 }));
                if (playAllRef.current) {
                    playNextInSequence();
                }
            });

            audioRefs.current[lineId].addEventListener('error', (e) => {
                console.error('Audio error:', e);
                setPlayingLineId(null);
            });
        }

        audioRefs.current[lineId].play();
        setPlayingLineId(lineId);
    };

    const handlePlayAll = () => {
        if (playAllMode) {
            stopAllAudio();
            setPlayAllMode(false);
            playAllRef.current = false;
            setCurrentPlayIndex(0);
            return;
        }

        setPlayAllMode(true);
        playAllRef.current = true;
        setCurrentPlayIndex(0);

        if (linesWithAudio.length > 0) {
            const firstLine = linesWithAudio[0];
            handlePlay(firstLine._id, firstLine.audioUrl);
        }
    };

    const playNextInSequence = () => {
        const nextIndex = currentPlayIndex + 1;
        if (nextIndex < linesWithAudio.length && playAllRef.current) {
            setCurrentPlayIndex(nextIndex);
            const nextLine = linesWithAudio[nextIndex];
            setTimeout(() => {
                handlePlay(nextLine._id, nextLine.audioUrl);
            }, 500);
        } else {
            setPlayAllMode(false);
            playAllRef.current = false;
            setCurrentPlayIndex(0);
        }
    };

    const handleDownload = (audioUrl, lineOrder, speaker) => {
        const fullUrl = getFullAudioUrl(audioUrl);
        if (!fullUrl) return;

        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = `${conversation?.title || 'conversation'}_line${lineOrder}_${speaker}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusBadge = (line) => {
        if (line.audioUrl && line.audioStatus === 'completed') {
            return <Badge status="success" text="Có audio" />;
        }
        if (line.audioStatus === 'failed') {
            return <Badge status="error" text="Lỗi" />;
        }
        return <Badge status="default" text="Chưa tạo" />;
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const totalLines = allLines.length;
    const completedLines = linesWithAudio.length;
    const progress = totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0;

    return (
        <Modal
            title={
                <Space>
                    <InfoCircleOutlined />
                    <span>Chi tiết Hội thoại</span>
                </Space>
            }
            open={open}
            onCancel={onClose}
            width={900}
            centered
            destroyOnClose
            footer={[
                <Button
                    key="playall"
                    icon={playAllMode ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                    onClick={handlePlayAll}
                    disabled={linesWithAudio.length === 0}
                    type={playAllMode ? 'primary' : 'default'}
                >
                    {playAllMode ? 'Dừng phát' : 'Phát tất cả'}
                </Button>,
                <Button
                    key="generate"
                    icon={<SoundOutlined />}
                    onClick={onGenerateAudio}
                >
                    Tạo/Cập nhật Audio
                </Button>,
                <Button key="close" type="primary" onClick={onClose}>
                    Đóng
                </Button>
            ]}
        >
            {/* Conversation Info */}
            <Card size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={2} size="small">
                    <Descriptions.Item label="Tiêu đề">
                        <Text strong>{conversation?.title}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Cấp độ">
                        <Tag color="blue">{conversation?.level}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Chủ đề">
                        <Tag>{conversation?.topic}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái Audio">
                        <Tag color={conversation?.audioGenerationStatus === 'completed' ? 'success' : 'processing'}>
                            {conversation?.audioGenerationStatus === 'completed' ? 'Hoàn thành' :
                                conversation?.audioGenerationStatus === 'pending' ? 'Chờ xử lý' :
                                    conversation?.audioGenerationStatus === 'in_progress' ? 'Đang xử lý' :
                                        conversation?.audioGenerationStatus || 'Chờ xử lý'}
                        </Tag>
                    </Descriptions.Item>
                </Descriptions>

                <Divider style={{ margin: '12px 0' }} />
                <Space wrap>
                    <Text type="secondary">Nhân vật:</Text>
                    {(conversation?.participants || []).map((p, i) => (
                        <Tag
                            key={p.id || i}
                            color={i === 0 ? 'green' : i === 1 ? 'blue' : 'purple'}
                        >
                            <UserOutlined /> {p.name}
                        </Tag>
                    ))}
                </Space>

                <div style={{ marginTop: 12 }}>
                    <Text type="secondary">Audio: {completedLines}/{totalLines} câu ({progress}%)</Text>
                    <Progress percent={progress} size="small" status={progress === 100 ? 'success' : 'active'} />
                </div>
            </Card>

            {/* Conversation Lines */}
            {allLines.length === 0 ? (
                <Empty description="Chưa có nội dung hội thoại" />
            ) : (
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {allLines.map((line, index) => {
                        const participant = participantMap[line.speaker] || {};
                        const hasAudio = line.audioUrl && line.audioStatus === 'completed';
                        const isPlaying = playingLineId === line._id;

                        return (
                            <Card
                                key={line._id || index}
                                size="small"
                                style={{
                                    marginBottom: 8,
                                    background: participant.bgColor || '#fafafa',
                                    borderLeft: `4px solid ${participant.color || '#d9d9d9'}`
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <Space style={{ marginBottom: 8 }}>
                                            <Tag
                                                style={{
                                                    backgroundColor: participant.color || '#d9d9d9',
                                                    color: '#fff',
                                                    border: 'none',
                                                    minWidth: 28,
                                                    textAlign: 'center'
                                                }}
                                            >
                                                {line.order || index + 1}
                                            </Tag>
                                            <Text strong style={{ color: participant.color }}>
                                                {line.speaker}
                                            </Text>
                                            {getStatusBadge(line)}
                                            {hasAudio && line.audioMetadata?.duration && (
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    ({formatDuration(line.audioMetadata.duration)})
                                                </Text>
                                            )}
                                        </Space>

                                        <Paragraph style={{ marginBottom: 0, fontSize: 14 }}>
                                            {line.content}
                                        </Paragraph>

                                        {isPlaying && (
                                            <Progress
                                                percent={audioProgress[line._id] || 0}
                                                size="small"
                                                showInfo={false}
                                                strokeColor={participant.color}
                                                style={{ marginTop: 8, marginBottom: 0 }}
                                            />
                                        )}
                                    </div>

                                    <Space style={{ marginLeft: 16 }}>
                                        {hasAudio ? (
                                            <>
                                                <Tooltip title={isPlaying ? 'Tạm dừng' : 'Phát'}>
                                                    <Button
                                                        size="small"
                                                        type={isPlaying ? 'primary' : 'default'}
                                                        icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                                                        onClick={() => handlePlay(line._id, line.audioUrl)}
                                                    />
                                                </Tooltip>
                                                <Tooltip title="Tải xuống">
                                                    <Button
                                                        size="small"
                                                        icon={<DownloadOutlined />}
                                                        onClick={() => handleDownload(line.audioUrl, line.order, line.speaker)}
                                                    />
                                                </Tooltip>
                                            </>
                                        ) : (
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                Chưa có audio
                                            </Text>
                                        )}
                                    </Space>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
};

export default ConversationDetailModal;
