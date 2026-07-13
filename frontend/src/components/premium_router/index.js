import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import TrialTimer from "../TrialTimer";

function PremiumRoute() {
    const isLogin = useSelector((state) => state.auth.isLogin);
    const user = useSelector((state) => state.auth.user);

    // 1. Chưa đăng nhập -> Ra Login
    if (!isLogin) return <Navigate to="/login" replace />;

    // 2. Admin và Giáo viên -> Luôn được xài chùa (Free Pass)
    const isStaff = user?.roles?.some(role => ['admin', 'teacher'].includes(role));
    if (isStaff) return <Outlet />;

    // 3. Học viên -> Kiểm tra xem đã mua khóa học chưa
    const hasPurchased = !!user?.activeSubscriptionId;
    if (hasPurchased) return <Outlet />;

    // 4. Kiểm tra xem đang trong thời gian dùng thử không
    const trialEndTime = localStorage.getItem('trialEndTime');
    const isTrialActive = trialEndTime && Date.now() < parseInt(trialEndTime, 10);

    if (isTrialActive) {
        // Có vé dùng thử -> Cho vào, đồng thời hiện đồng hồ
        return (
            <>
                <TrialTimer />
                <Outlet />
            </>
        );
    }

    // Không có mua khóa học & không có vé dùng thử -> Đá ra ngoài
    return <Navigate to="/payment" replace />;
}

export default PremiumRoute;