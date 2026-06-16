import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <Result
            status="404"
            title="404"
            subTitle="Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ."
            extra={
                <Button type="primary" onClick={() => navigate('/')}>
                    Về Trang Chủ
                </Button>
            }
            style={{ marginTop: '100px' }}
        />
    );
};

export default NotFound;
