import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuth, logout } from './redux/authSlice';
import Allroutes from './components/allroutes';
import './App.css';
import AOS from 'aos';     // Thư viện hiệu ứng trồi lên
import 'aos/dist/aos.css';  
import SmoothScroll from './components/smooth_scroll'; // Component cuộn mượt

function App() {
  const dispatch = useDispatch();
  // --useEffect 1: Kiểm tra đăng nhập và validate token
  useEffect(() => {
    dispatch(checkAuth());
    
    // Kiểm tra token hợp lệ bằng cách gọi API /auth/me
    const validateToken = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const api = (await import('./services/api')).default;
          await api.get('/auth/me');
        } catch (error) {
          // Token không hợp lệ -> logout
          if (error.response?.status === 401) {
            dispatch(logout());
          }
        }
      }
    };
    
    validateToken();
  }, [dispatch]);

  // --- useEffect 2: Cấu hình AOS & Tự động gắn hiệu ứng
  useEffect(() => {
    // A. Đoạn code : Tự động tìm thẻ để gắn hiệu ứng
    // Tìm tất cả thẻ: Tiêu đề (h1-h6), đoạn văn (p), ảnh (img), Card Antd (.ant-card), Nút (button)
    const tagsToAnimate = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, img, .ant-card, button');

    tagsToAnimate.forEach((el) => {
      // Chỉ gắn nếu thẻ đó CHƯA CÓ data-aos (để không đè lên những chỗ đã chỉnh tay ở trang Home)
      if (!el.getAttribute('data-aos')) {
        el.setAttribute('data-aos', 'fade-up'); // Mặc định là bay từ dưới lên
        el.setAttribute('data-aos-duration', '1000'); // Tốc độ bay là 1 giây
      }
    });

    // B. Khởi động AOS
    AOS.init({
      duration: 1000,     // Thời gian chạy hiệu ứng (ms)
      once: true,         // Chỉ chạy 1 lần (không lặp lại khi cuộn lên xuống để đỡ rối mắt)
      offset: 50,         // Cách mép dưới 50px thì bắt đầu chạy
      easing: 'ease-out-cubic', // Kiểu chuyển động mượt
      delay: 50,          // Độ trễ mặc định nhỏ
    });
    
    // Refresh lại để đảm bảo AOS nhận diện được các thẻ vừa gắn attribute
    AOS.refresh();

  }, []); // Chạy 1 lần khi web vừa tải

  return (
    <>
      {/* --- 2. BỌC SMOOTH SCROLL RA NGOÀI CÙNG --- */}
      <SmoothScroll>
        <div className="App">
            <Allroutes />
        </div>
      </SmoothScroll>
    </>
  );
}

export default App;