import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * Admin Router - Bảo vệ admin routes
 * Chỉ cho phép user có role 'admin' truy cập
 */
function AdminRoute() {
    const isLogin = useSelector((state) => state.auth.isLogin);
    const user = useSelector((state) => state.auth.user);

    // Chưa đăng nhập -> redirect to login
    if (!isLogin) {
        return <Navigate to="/login" replace />;
    }

    // Đã đăng nhập nhưng không phải admin -> redirect to home
    if (!user || !user.roles || !user.roles.includes('admin')) {
        return <Navigate to="/" replace />;
    }

    // Là admin -> cho phép truy cập
    return <Outlet />;
}

export default AdminRoute;
