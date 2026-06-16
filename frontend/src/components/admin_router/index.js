import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

function AdminRoute() {
    const isLogin = useSelector((state) => state.auth.isLogin);
    const user = useSelector((state) => state.auth.user);

    // 1. Chưa đăng nhập -> Sút ra trang Login
    if (!isLogin) {
        return <Navigate to="/login" replace />;
    }

    // 2. Kiểm tra xem có phải là nhân sự nội bộ không (admin hoặc teacher)
    const isStaff = user?.roles?.some(role => ['admin', 'teacher'].includes(role));

    // 3. Nếu là học viên (student) đi lạc -> Sút về trang chủ
    if (!isStaff) {
        return <Navigate to="/" replace />;
    }

    // 4. Đúng người đúng tội -> Mời vào khu vực quản trị
    return <Outlet />;
}

export default AdminRoute;