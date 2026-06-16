import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Proxy component để xử lý khi Google redirect về frontend URL
 * (do Google Console được cấu hình với frontend URL)
 * Component này sẽ redirect đến backend URL với đầy đủ query params
 */
function GoogleOAuthProxy() {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Lấy tất cả query params từ URL hiện tại
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Build backend URL
        const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
        const callbackUrl = `${backendUrl}/auth/google/callback`;

        // Build query string
        const params = new URLSearchParams();
        if (code) params.append('code', code);
        if (state) params.append('state', state);
        if (error) params.append('error', error);

        // Redirect đến backend với đầy đủ params
        const fullUrl = `${callbackUrl}?${params.toString()}`;
        window.location.href = fullUrl;
    }, [searchParams]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            flexDirection: 'column'
        }}>
            <p>Đang chuyển hướng đến server xác thực...</p>
        </div>
    );
}

export default GoogleOAuthProxy;
