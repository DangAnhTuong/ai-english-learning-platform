import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/authSlice';
import { authService } from '../../services/authService';

function Logout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Gọi API logout với refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          await authService.logout(refreshToken);
        }
      } catch (error) {
        console.error('Logout API error:', error);
        // Vẫn tiếp tục logout dù API fail
      } finally {
        // Xóa Redux + LocalStorage
        dispatch(logout());
        // Chuyển hướng về trang đăng nhập
        navigate('/login');
      }
    };

    handleLogout();
  }, [dispatch, navigate]);

  return (
    <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        fontSize: '20px',
        color: '#666'
    }}>
      Đang đăng xuất...
    </div>
  );
}

export default Logout;