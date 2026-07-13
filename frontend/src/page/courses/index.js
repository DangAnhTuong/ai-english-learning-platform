import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import './style.css';

function Courses() {
  const navigate = useNavigate();

  return (
    <div className="courses-page" style={{ padding: '60px 20px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status="info"
        title="Tính năng đang phát triển"
        subTitle="Tính năng Khóa học hiện đang được chúng tôi xây dựng và hoàn thiện. Trong thời gian chờ đợi, bạn hãy trải nghiệm học, nói và hội thoại với AI thông qua Chat Box và Luyện Hội Thoại nhé!"
        extra={[
          <Button type="primary" key="conversation" size="large" onClick={() => navigate('/conversation')}>
            Luyện Hội Thoại
          </Button>,
          <Button key="chatbox" size="large" onClick={() => navigate('/chatbox')}>
            Chat Box AI
          </Button>,
        ]}
      />
    </div>
  );
}

export default Courses;
