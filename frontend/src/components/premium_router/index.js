import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

function PremiumRoute() {
    const isLogin = useSelector((state) => state.auth.isLogin);
    const user = useSelector((state) => state.auth.user);

    // 1. Chưa đăng nhập -> Ra Login
    if (!isLogin) return <Navigate to="/login" replace />;

    // 2. Admin và Giáo viên -> Luôn được xài chùa (Free Pass)
    const isStaff = user?.roles?.some(role => ['admin', 'teacher'].includes(role));
    if (isStaff) return <Outlet />;

    // 3. Học viên -> Kiểm tra xem đã mua khóa học chưa
    // (Dựa vào file Schema lúc nãy, bạn có trường activeSubscriptionId)
    // Nếu bạn dùng trường khác (ví dụ: isPremium), hãy sửa lại chữ activeSubscriptionId ở dưới
    const hasPurchased = !!user?.activeSubscriptionId;

    if (!hasPurchased) {
        // Chưa mua khóa học -> Đá thẳng ra trang thanh toán (hoặc trang danh sách khóa học)
        return <Navigate to="/payment" replace />;
    }

    // 4. Đã mua khóa học -> Mời vào xài AI
    return <Outlet />;
}

export default PremiumRoute;