import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

function Private() {
    // Lấy trạng thái đăng nhập từ Redux
    const isLogin = useSelector((state) => state.auth.isLogin);

    //Nếu ĐÚNG là đã đăng nhập -> Cho hiển thị nội dung bên trong (Outlet)
    //Nếu SAI (chưa đăng nhập) -> Đá về trang Login
    return isLogin ? <Outlet /> : <Navigate to="/login" replace />;

    //return <Outlet />;
}

export default Private;