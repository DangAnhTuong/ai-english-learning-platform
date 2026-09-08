import React, { useState, useEffect, useRef } from 'react';
import { Button, Space, Tag, Spin, Tooltip } from 'antd';
import { BulbOutlined, ReloadOutlined, SendOutlined } from '@ant-design/icons';
import { chatService } from '../services/chatService';

/**
 * Sinh gợi ý phản xạ tức thì (0ms) dựa theo ngữ cảnh hội thoại
 */
const generateInstantSuggestions = (text) => {
    if (!text || typeof text !== 'string') return [];
    const lower = text.toLowerCase().trim();

    if (lower.includes('c++') || lower.includes('code') || lower.includes('program')) {
        return [
            "How do variables work in C++?",
            "Can you show a simple example?",
            "Is C++ good for beginners?"
        ];
    }
    if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('sleep') || lower.includes('rest')) {
        return [
            "I had a very long day at work.",
            "I should go to bed soon.",
            "A warm cup of tea sounds nice!"
        ];
    }
    if (lower.includes('how are you') || lower.includes('how is your day') || lower.includes('how r u')) {
        return [
            "I'm doing great, thank you!",
            "Pretty good, how about you?",
            "A bit busy, but I'm fine!"
        ];
    }
    if (lower.includes('name') || lower.includes('call me') || lower.includes('tên')) {
        return [
            "Nice to meet you, Tutor!",
            "Can we practice everyday English?",
            "What should we start with today?"
        ];
    }
    if (lower.includes('food') || lower.includes('order') || lower.includes('restaurant') || lower.includes('menu')) {
        return [
            "Could I see the menu, please?",
            "What is today's special dish?",
            "Can I have the bill, please?"
        ];
    }
    if (lower.endsWith('?')) {
        if (lower.includes('what')) {
            return [
                "I'd love to learn more about that.",
                "Could you give me an example?",
                "That sounds very interesting!"
            ];
        }
        if (lower.includes('why') || lower.includes('how')) {
            return [
                "Because I want to speak fluently.",
                "Through daily conversation practice.",
                "It really helps my career!"
            ];
        }
        return [
            "Yes, absolutely!",
            "Not really, to be honest.",
            "Sometimes, depends on the day."
        ];
    }

    return [
        "Could you explain more about that?",
        "That sounds very interesting!",
        "What do you recommend next?"
    ];
};

/**
 * SmartSuggestions
 * Hiển thị các chip gợi ý câu trả lời nhanh phù hợp ngữ cảnh hội thoại siêu tốc (0ms)
 */
export const SmartSuggestions = ({ lastAiMessage, onSelectSuggestion, disabled = false, isTyping = false }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const lastMsgRef = useRef('');

    useEffect(() => {
        // Chỉ cập nhật gợi ý khi AI ĐÃ GÕ XONG (không còn typing) và câu mới khác câu cũ
        if (!isTyping && lastAiMessage && lastAiMessage.trim().length > 0 && lastAiMessage !== lastMsgRef.current) {
            lastMsgRef.current = lastAiMessage;
            const instant = generateInstantSuggestions(lastAiMessage);
            setSuggestions(instant);
        }
    }, [lastAiMessage, isTyping]);

    const fetchSuggestionsFromApi = async (msg) => {
        setLoading(true);
        try {
            const res = await chatService.getQuickSuggestions(msg);
            if (res && res.suggestions && res.suggestions.length > 0) {
                setSuggestions(res.suggestions);
            }
        } catch (err) {
            console.error('Failed to get suggestions:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!lastAiMessage || (suggestions.length === 0 && !loading)) {
        return null;
    }

    return (
        <div className="smart-suggestions-bar" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            background: 'rgba(240, 247, 255, 0.65)',
            backdropFilter: 'blur(8px)',
            borderTop: '1px solid rgba(22, 119, 255, 0.08)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1677ff', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                <BulbOutlined /> Gợi ý:
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888' }}>
                    <Spin size="small" /> <span>Đang tạo gợi ý phản xạ...</span>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap' }}>
                    {suggestions.map((suggestion, idx) => (
                        <Tag
                            key={idx}
                            className="suggestion-chip"
                            onClick={() => !disabled && onSelectSuggestion(suggestion)}
                            style={{
                                cursor: disabled ? 'not-allowed' : 'pointer',
                                background: '#ffffff',
                                border: '1px solid #bae0ff',
                                color: '#0958d9',
                                padding: '3px 10px',
                                borderRadius: 16,
                                fontSize: 12,
                                fontWeight: 500,
                                margin: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'all 0.2s ease',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                            }}
                        >
                            <span>{suggestion}</span>
                            <SendOutlined style={{ fontSize: 10, opacity: 0.7 }} />
                        </Tag>
                    ))}

                    <Tooltip title="Lấy gợi ý khác">
                        <Button
                            size="small"
                            type="text"
                            shape="circle"
                            icon={<ReloadOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />}
                            onClick={() => fetchSuggestionsFromApi(lastAiMessage)}
                            disabled={disabled}
                        />
                    </Tooltip>
                </div>
            )}
        </div>
    );
};

export default SmartSuggestions;
