import { Navigate } from "react-router-dom"; // Thêm dòng này để điều hướng
import Layout from "../layout/layout_default";
import Home from "../page/home";
import Login from "../page/login";
import Register from "../page/register";
import Private from "../components/private_router";
import AdminRoute from "../components/admin_router";
import "./style.css";
import Conversation from "../page/conversation";
import Logout from "../page/logout";
import Mindmap from "../page/mindmap";
import PaymentPage from "../page/payment";
// --- IMPORT PHẦN ADMIN
import AdminLayout from "../layout/AdminLayout";
import UserAdmin from "../page/admin/UserAdmin";
import TeacherModules from "../page/admin/TeacherModules";
import ContextManager from "../page/admin/ContextManager";

import OrderAdmin from "../page/admin/OrderAdmin";
import SetupPayment from '../page/admin/SetupPayment';
import CourseAdmin from '../page/admin/CourseAdmin';
import AdminDashboard from '../page/admin/AdminDashboard';

import Profile from "../page/profile";
import Chatbox from "../page/chatbox";
import LearningGuide from "../page/guide";
import Courses from "../page/courses";
import CourseDetail from "../page/course-detail";
import MyCourses from "../page/my-courses";
import FAQ from "../page/faq";
import Contact from "../page/contact";
import ActivateCode from "../page/activate";
import RefundPolicy from "../page/refund";
import About from "../page/about";
import PrivacyPolicy from "../page/policy";
import TermsOfService from "../page/terms";
import VerifyEmail from "../page/verify-email";
import AuthCallback from "../page/auth-callback";
import GoogleOAuthProxy from "../page/google-oauth-proxy";

// console.log("Check AdminLayout:", AdminLayout);
// console.log("Check UserAdmin:", UserAdmin);
// console.log("Check TeacherModules:", TeacherModules);
// console.log("Check ContextManager:", ContextManager);
export const routes = [
    {
        path: "/",
        element: <Layout />,
        children: [
            // 1. NHÓM PUBLIC (Ai cũng xem được)
            {
                index: true,
                element: <Home />,
            },

            // 2. NHÓM PRIVATE (Phải đăng nhập mới xem được)
            {
                element: <Private />,
                children: [
                    {
                        path: "conversation", // Luyện hội thoại
                        element: <Conversation />,
                    },
                    {
                        path: "mindmap", // Tra từ điển Mindmap
                        element: <Mindmap />,
                    },
                    {
                        path: "profile",
                        element: <Profile />,
                    }, {
                        path: "chatbox",
                        element: <Chatbox />,
                    },
                    {
                        path: "payment",
                        element: <PaymentPage />,
                    },
                    {
                        path: "my-courses", // Khóa học của tôi
                        element: <MyCourses />,
                    }
                ]
            },
            // Public course routes
            {
                path: "courses",
                element: <Courses />,
            },
            {
                path: "courses/:courseId",
                element: <CourseDetail />,
            },

            {
                path: "logout",
                element: <Logout />,
            },
            {
                path: "guide",
                element: <LearningGuide />,
            }, {

                path: "faq",
                element: <FAQ />,
            },
            {
                path: "contact",
                element: <Contact />,
            },
            {
                path: "activate",
                element: <ActivateCode />,
            },
            {
                path: "refund-policy",
                element: <RefundPolicy />,
            },
            {
                path: "about",
                element: <About />,
            },
            {
                path: "privacy-policy",
                element: <PrivacyPolicy />,
            },
            {
                path: "terms-of-service",
                element: <TermsOfService />,
            },
        ]
    },

    // Auth callback routes (không có Layout)
    {
        path: "verify-email",
        element: <VerifyEmail />,
    },
    {
        path: "auth/callback",
        element: <AuthCallback />,
    },
    {
        path: "auth/error",
        element: <AuthCallback />,
    },
    // Proxy route để xử lý khi Google redirect về frontend URL
    // (do Google Console có thể được cấu hình với frontend URL)
    {
        path: "api/v1/auth/google/callback",
        element: <GoogleOAuthProxy />,
    },

    // PHẦN ADMIN 

    {
        path: "/admin",
        element: <AdminRoute />, //dùng AdminRoute để bảo vệ (chỉ admin mới vào được)
        children: [
            {
                element: <AdminLayout />,
                children: [
                    // Admin Dashboard
                    { index: true, element: <Navigate to="dashboard" replace /> },
                    { path: "dashboard", element: <AdminDashboard /> },

                    // Quản lý người dùng
                    { path: "users", element: <UserAdmin /> },

                    // Chức năng giáo viên
                    { path: "teacher-modules", element: <TeacherModules /> },

                    // Quản lý gói & chủ đề
                    { path: "context", element: <ContextManager /> },

                    // Quản lý khóa học
                    { path: "courses", element: <CourseAdmin /> },

                    { path: "orders", element: <OrderAdmin /> },

                    { path: "setuppayment", element: <SetupPayment /> },
                ]
            }
        ]
    },

    // 3. NHÓM AUTH (Không có Header/Footer)
    {
        path: "login",
        element: <Login />,
    },
    {
        path: "register",
        element: <Register />,
    }
];