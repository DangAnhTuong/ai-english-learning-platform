import { ReactLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';

function SmoothScroll({ children }) {
    const lenisOptions = {
        lerp: 1,
        duration: 0.8,
        smoothWheel: true,
        // smoothTouch: false, // Bản mới thường tự xử lý tốt, có thể bỏ dòng này hoặc giữ nếu muốn
    };

    return (
        <ReactLenis root options={lenisOptions}>
            {children}
        </ReactLenis>
    );
}

export default SmoothScroll;