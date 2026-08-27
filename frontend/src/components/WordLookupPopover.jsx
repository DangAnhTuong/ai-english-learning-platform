import React, { useState, useRef } from 'react';
import { Popover, Tag, Spin, Button, Typography, Space } from 'antd';
import { SoundOutlined, BookOutlined } from '@ant-design/icons';
import { chatService } from '../services/chatService';

const { Text } = Typography;

/**
 * WordLookupPopover
 * Bọc một đoạn text tiếng Anh, cho phép click vào bất kỳ từ vựng nào để tra cứu nhanh:
 * - Phiên âm IPA
 * - Loại từ (Noun, Verb, Adj...)
 * - Nghĩa tiếng Việt
 * - Ví dụ & Phát âm chuẩn
 */
export const WordLookupPopover = ({ text, className = '' }) => {
    const [activeWord, setActiveWord] = useState(null);
    const [lookupData, setLookupData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const cacheRef = useRef({});

    const handleWordClick = async (word, e) => {
        e.stopPropagation();
        const cleanWord = word.replace(/^[^\w]+|[^\w]+$/g, '').trim().toLowerCase();
        if (!cleanWord || cleanWord.length < 2 || /^\d+$/.test(cleanWord)) return;

        setActiveWord(cleanWord);
        setPopoverOpen(true);

        if (cacheRef.current[cleanWord]) {
            setLookupData(cacheRef.current[cleanWord]);
            return;
        }

        setLoading(true);
        try {
            const res = await chatService.lookupWord(cleanWord);
            if (res && res.data) {
                cacheRef.current[cleanWord] = res.data;
                setLookupData(res.data);
            }
        } catch (err) {
            console.error('Word lookup failed:', err);
            setLookupData({
                word: cleanWord,
                ipa: '',
                type: 'word',
                meaning: `Từ: ${cleanWord}`,
                example: ''
            });
        } finally {
            setLoading(false);
        }
    };

    const playWordAudio = (wordToSpeak, e) => {
        e?.stopPropagation();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(wordToSpeak || activeWord);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    };

    const popoverContent = (
        <div style={{ width: 260, padding: '4px 0' }}>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <Spin size="small" />
                    <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>Đang tra từ...</div>
                </div>
            ) : lookupData ? (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Space align="center">
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#1677ff', textTransform: 'capitalize' }}>
                                {lookupData.word}
                            </span>
                            {lookupData.type && (
                                <Tag color="geekblue" style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>
                                    {lookupData.type}
                                </Tag>
                            )}
                        </Space>
                        <Button 
                            shape="circle" 
                            size="small" 
                            type="text" 
                            icon={<SoundOutlined style={{ color: '#1677ff' }} />} 
                            onClick={(e) => playWordAudio(lookupData.word, e)}
                            title="Nghe phát âm"
                        />
                    </div>

                    {lookupData.ipa && (
                        <div style={{ fontSize: 13, color: '#666', fontStyle: 'italic', marginBottom: 6 }}>
                            {lookupData.ipa}
                        </div>
                    )}

                    <div style={{ 
                        background: '#f8fafc', 
                        padding: '6px 10px', 
                        borderRadius: 6, 
                        borderLeft: '3px solid #1677ff', 
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#1e293b',
                        marginBottom: lookupData.example ? 6 : 0
                    }}>
                        {lookupData.meaning}
                    </div>

                    {lookupData.example && (
                        <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
                            "{lookupData.example}"
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ fontSize: 12, color: '#999' }}>Không tìm thấy dữ liệu từ.</div>
            )}
        </div>
    );

    if (!text || typeof text !== 'string') {
        return <span>{text}</span>;
    }

    // Tách các từ và giữ nguyên khoảng trắng + ký tự đặc biệt
    const tokens = text.split(/(\s+|[.,!?;:()""'`]+)/);

    return (
        <span className={`interactive-text-container ${className}`}>
            {tokens.map((token, index) => {
                const isWord = /^[a-zA-Z]{2,}(?:'[a-zA-Z]+)?$/.test(token);

                if (!isWord) {
                    return <span key={index}>{token}</span>;
                }

                const isCurrentActive = activeWord === token.toLowerCase() && popoverOpen;

                return (
                    <Popover
                        key={index}
                        content={popoverContent}
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888' }}>
                                <BookOutlined /> Tra từ vựng nhanh
                            </div>
                        }
                        trigger="click"
                        open={isCurrentActive}
                        onOpenChange={(visible) => {
                            if (!visible) setPopoverOpen(false);
                        }}
                        overlayStyle={{ zIndex: 1050 }}
                    >
                        <span
                            onClick={(e) => handleWordClick(token, e)}
                            className="clickable-vocab-word"
                            style={{
                                cursor: 'pointer',
                                borderRadius: 3,
                                transition: 'all 0.15s ease',
                                display: 'inline-block',
                                padding: '0 1px'
                            }}
                        >
                            {token}
                        </span>
                    </Popover>
                );
            })}
        </span>
    );
};

export default WordLookupPopover;
