import React, { useState, useEffect } from 'react';
import { Button, Space, Tag, Spin, Tooltip } from 'antd';
import { BulbOutlined, ReloadOutlined, SendOutlined } from '@ant-design/icons';
import { chatService } from '../services/chatService';

/**
 * SmartSuggestions
 * Hiển thị các chip gợi ý câu trả lời nhanh phù hợp ngữ cảnh hội thoại
 */
export const SmartSuggestions = ({ lastAiMessage, onSelectSuggestion, disabled = false }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (lastAiMessage && lastAiMessage.trim().length > 0) {
            fetchSuggestions(lastAiMessage);
        }
    }, [lastAiMessage]);

    const fetchSuggestions = async (msg) => {
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
                            onClick={() => fetchSuggestions(lastAiMessage)}
                            disabled={disabled}
                        />
                    </Tooltip>
                </div>
            )}
        </div>
    );
};

export default SmartSuggestions;
