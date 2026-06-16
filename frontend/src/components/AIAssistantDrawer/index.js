import React, { useState, useRef, useEffect } from 'react';
import { Drawer, Input, Button, List, Avatar, Spin, message, FloatButton } from 'antd';
import { RobotOutlined, UserOutlined, SendOutlined, AudioOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import axios from 'axios';

const { TextArea } = Input;

const AIAssistantDrawer = ({ courseTitle, moduleTitle }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const showDrawer = () => {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `Chào bạn! Mình là AI Trợ giảng. Bạn đang học bài thuộc module "${moduleTitle}" của khóa "${courseTitle}". Bạn có câu hỏi gì không?`,
        },
      ]);
    }
  };

  const onClose = () => {
    setOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const contextPrompt = `Tôi đang học khóa học "${courseTitle}", bài học thuộc phần "${moduleTitle}". Dưới đây là câu hỏi của tôi: ${userMsg}`;
      
      const response = await axios.post(
        `${process.env.REACT_APP_PYTHON_API_URL}/api/v1/voice_chat/chat`,
        {
          text: contextPrompt,
          session_id: `course_${user?.id || 'guest'}`,
          language: 'vi-VN'
        }
      );

      if (response.data && response.data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: response.data.reply },
        ]);
      } else {
        throw new Error('No reply from AI');
      }
    } catch (error) {
      console.error('AI Error:', error);
      message.error('AI đang bận, vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FloatButton
        icon={<RobotOutlined style={{ fontSize: 28 }}/>}
        type="primary"
        style={{ right: 24, bottom: 24, width: 60, height: 60, zIndex: 9999 }}
        onClick={showDrawer}
        tooltip="Hỏi AI Trợ giảng"
      />
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RobotOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <span>AI Trợ giảng</span>
          </div>
        }
        placement="right"
        onClose={onClose}
        open={open}
        width={400}
        bodyStyle={{ display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, backgroundColor: '#f0f2f5' }}>
          <List
            itemLayout="horizontal"
            dataSource={messages}
            renderItem={(item) => (
              <List.Item style={{ borderBottom: 'none', padding: '8px 0' }}>
                <div style={{ 
                  display: 'flex', 
                  width: '100%', 
                  justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start' 
                }}>
                  {item.role === 'assistant' && (
                    <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff', marginRight: 8 }} />
                  )}
                  <div style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: item.role === 'user' ? '#1890ff' : '#fff',
                    color: item.role === 'user' ? '#fff' : '#000',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}>
                    {item.content}
                  </div>
                  {item.role === 'user' && (
                    <Avatar src={user?.avatar} icon={<UserOutlined />} style={{ marginLeft: 8 }} />
                  )}
                </div>
              </List.Item>
            )}
          />
          {loading && (
            <div style={{ textAlign: 'left', padding: '8px 0' }}>
              <Spin size="small" /> <span style={{ marginLeft: 8, color: '#999' }}>AI đang soạn câu trả lời...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ padding: 16, borderTop: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={loading}
              style={{ height: 'auto' }}
            />
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default AIAssistantDrawer;
