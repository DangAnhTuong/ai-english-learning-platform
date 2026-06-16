import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuth, logout } from './redux/authSlice';
import Allroutes from './components/allroutes';
import ErrorBoundary from './components/ErrorBoundary'; // Import Error Boundary
import './App.css';
import AOS from 'aos';     
import 'aos/dist/aos.css';  
import SmoothScroll from './components/smooth_scroll'; 

function App() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    dispatch(checkAuth());
    
    const validateToken = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const api = (await import('./services/api')).default;
          await api.get('/auth/me');
        } catch (error) {
          if (error.response?.status === 401) {
            dispatch(logout());
          }
        }
      }
    };
    
    validateToken();
  }, [dispatch]);

  useEffect(() => {
    const tagsToAnimate = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, img, .ant-card, button');

    tagsToAnimate.forEach((el) => {
      if (!el.getAttribute('data-aos')) {
        el.setAttribute('data-aos', 'fade-up');
        el.setAttribute('data-aos-duration', '1000');
      }
    });

    AOS.init({
      duration: 1000,     
      once: true,         
      offset: 50,         
      easing: 'ease-out-cubic', 
      delay: 50,          
    });
    
    AOS.refresh();
  }, []); 

  return (
    <ErrorBoundary>
      <SmoothScroll>
        <div className="App">
            <Allroutes />
        </div>
      </SmoothScroll>
    </ErrorBoundary>
  );
}

export default App;