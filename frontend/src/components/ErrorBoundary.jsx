import React from 'react';
import { Result, Button, Typography } from 'antd';

const { Paragraph, Text } = Typography;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Cập nhật state để lần render tiếp theo hiển thị UI fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Bạn có thể ghi log lỗi vào một dịch vụ báo cáo lỗi
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Bạn có thể render bất kỳ UI fallback nào
      return (
        <div style={{ padding: '50px', background: '#f0f2f5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Result
            status="500"
            title="Đã xảy ra lỗi không mong muốn"
            subTitle="Hệ thống đang gặp sự cố nhỏ. Vui lòng tải lại trang hoặc quay lại sau."
            extra={
                <Button type="primary" onClick={() => window.location.href = '/'}>
                Về Trang Chủ
                </Button>
            }
            >
            <div className="desc">
                <Paragraph>
                <Text strong style={{ fontSize: 16 }}>
                    Chi tiết kỹ thuật (dành cho bộ phận hỗ trợ):
                </Text>
                </Paragraph>
                <Paragraph style={{ background: '#fff', padding: 15, borderRadius: 8, border: '1px solid #d9d9d9', overflowX: 'auto' }}>
                <Text type="danger">{this.state.error && this.state.error.toString()}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                </Text>
                </Paragraph>
            </div>
            </Result>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
