import React, { useRef, useState, useEffect } from 'react';
import { Button, Space, Tooltip, Progress } from 'antd';
import { SoundOutlined, PauseOutlined, PlayCircleOutlined, LoadingOutlined } from '@ant-design/icons';

/**
 * Audio Player Component
 * Hiển thị và phát audio file
 */
const AudioPlayer = ({ 
    audioUrl, 
    size = 'default',
    showProgress = false,
    onPlay,
    onPause,
    onEnded,
    autoPlay = false
}) => {
    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => {
            setPlaying(false);
            setCurrentTime(0);
            if (onEnded) onEnded();
        };
        const handleLoadStart = () => setLoading(true);
        const handleCanPlay = () => setLoading(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplay', handleCanPlay);

        if (autoPlay && audioUrl) {
            audio.play().then(() => setPlaying(true)).catch(() => setLoading(false));
        }

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('canplay', handleCanPlay);
        };
    }, [audioUrl, autoPlay, onEnded]);

    const handlePlayPause = () => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;

        if (playing) {
            audio.pause();
            setPlaying(false);
            if (onPause) onPause();
        } else {
            setLoading(true);
            audio.play()
                .then(() => {
                    setPlaying(true);
                    setLoading(false);
                    if (onPlay) onPlay();
                })
                .catch((error) => {
                    console.error('Audio play error:', error);
                    setLoading(false);
                });
        }
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    if (!audioUrl) {
        return (
            <Tooltip title="Chưa có audio">
                <Button 
                    icon={<SoundOutlined />} 
                    disabled 
                    size={size}
                />
            </Tooltip>
        );
    }

    return (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Space>
                <Button
                    type={playing ? 'primary' : 'default'}
                    icon={loading ? <LoadingOutlined /> : (playing ? <PauseOutlined /> : <PlayCircleOutlined />)}
                    onClick={handlePlayPause}
                    size={size}
                    loading={loading}
                >
                    {playing ? 'Dừng' : 'Phát'}
                </Button>
                {showProgress && duration > 0 && (
                    <span style={{ fontSize: 12, color: '#666' }}>
                        {Math.floor(currentTime)}s / {Math.floor(duration)}s
                    </span>
                )}
            </Space>
            {showProgress && (
                <Progress 
                    percent={progress} 
                    showInfo={false} 
                    size="small"
                    strokeColor="#1890ff"
                />
            )}
            <audio ref={audioRef} src={audioUrl} preload="metadata" />
        </Space>
    );
};

export default AudioPlayer;
