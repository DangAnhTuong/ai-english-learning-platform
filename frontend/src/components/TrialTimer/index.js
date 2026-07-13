import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClockCircleOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import './style.css';

function TrialTimer() {
    const navigate = useNavigate();
    const location = useLocation();
    const [timeLeft, setTimeLeft] = useState(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const checkTime = () => {
            const trialEndTime = localStorage.getItem('trialEndTime');
            
            if (!trialEndTime) {
                return; // Nếu không có thời gian dùng thử thì không làm gì cả
            }

            const now = Date.now();
            const end = parseInt(trialEndTime, 10);
            const remaining = end - now;

            if (remaining <= 0) {
                // Đã hết giờ
                setTimeLeft(0);
                if (!isExpired) {
                    setIsExpired(true);
                    localStorage.removeItem('trialEndTime');
                    
                    Modal.warning({
                        title: 'Đã hết thời gian dùng thử',
                        content: 'Thời gian 5 phút trải nghiệm miễn phí đã kết thúc. Vui lòng đăng ký gói Premium để tiếp tục sử dụng tính năng này!',
                        okText: 'Nâng cấp ngay',
                        onOk: () => {
                            navigate('/payment');
                        }
                    });
                }
            } else {
                // Còn thời gian
                setTimeLeft(Math.floor(remaining / 1000));
            }
        };

        // Chạy lần đầu
        checkTime();

        // Cập nhật mỗi giây
        const interval = setInterval(checkTime, 1000);

        return () => clearInterval(interval);
    }, [navigate, isExpired, location]);

    // Format thời gian thành MM:SS
    const formatTime = (seconds) => {
        if (seconds === null) return null;
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (timeLeft === null || isExpired) return null;

    // Đổi màu cảnh báo nếu còn dưới 1 phút
    const isWarning = timeLeft <= 60;

    return (
        <div className={`trial-timer ${isWarning ? 'warning' : ''}`}>
            <ClockCircleOutlined spin={isWarning} />
            <div className="trial-timer-content">
                <span className="trial-timer-title">Thời gian dùng thử</span>
                <span className="trial-timer-countdown">{formatTime(timeLeft)}</span>
            </div>
        </div>
    );
}

export default TrialTimer;
