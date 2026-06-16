import { lazy } from "react";
import { Navigate } from "react-router-dom"; 
import Layout from "../layout/layout_default";
import Private from "../components/private_router";
import AdminRoute from "../components/admin_router";
import PremiumRoute from "../components/premium_router"; 
import "./style.css";

// Lazy Load Pages
const Home = lazy(() => import("../page/home"));
const Login = lazy(() => import("../page/login"));
const Register = lazy(() => import("../page/register"));
const Conversation = lazy(() => import("../page/conversation"));
const Logout = lazy(() => import("../page/logout"));
const Mindmap = lazy(() => import("../page/mindmap"));
const PaymentPage = lazy(() => import("../page/payment"));
const Flashcards = lazy(() => import("../page/flashcards"));

const AdminLayout = lazy(() => import("../layout/AdminLayout"));
const UserAdmin = lazy(() => import("../page/admin/UserAdmin"));
const TeacherModules = lazy(() => import("../page/admin/TeacherModules"));
const ContextManager = lazy(() => import("../page/admin/ContextManager"));
const OrderAdmin = lazy(() => import("../page/admin/OrderAdmin"));
const SetupPayment = lazy(() => import("../page/admin/SetupPayment"));
const CourseAdmin = lazy(() => import("../page/admin/CourseAdmin"));
const AdminDashboard = lazy(() => import("../page/admin/AdminDashboard"));

const Profile = lazy(() => import("../page/profile"));
const Chatbox = lazy(() => import("../page/chatbox"));
const LearningGuide = lazy(() => import("../page/guide"));
const Courses = lazy(() => import("../page/courses"));
const CourseDetail = lazy(() => import("../page/course-detail"));
const MyCourses = lazy(() => import("../page/my-courses"));
const FAQ = lazy(() => import("../page/faq"));
const Contact = lazy(() => import("../page/contact"));
const ActivateCode = lazy(() => import("../page/activate"));
const RefundPolicy = lazy(() => import("../page/refund"));
const About = lazy(() => import("../page/about"));
const PrivacyPolicy = lazy(() => import("../page/policy"));
const TermsOfService = lazy(() => import("../page/terms"));
const VerifyEmail = lazy(() => import("../page/verify-email"));
const AuthCallback = lazy(() => import("../page/auth-callback"));
const GoogleOAuthProxy = lazy(() => import("../page/google-oauth-proxy"));
const AITest = lazy(() => import("../page/AITest"));
const NotFound = lazy(() => import("../components/NotFound"));

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
                        path: "profile",
                        element: <Profile />,
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

            // 3. NHÓM PREMIUM (Chat AI - Yêu cầu trả phí hoặc Admin/Teacher)
            {
                element: <PremiumRoute />,
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
                        path: "chatbox",
                        element: <Chatbox />,
                    },
                    {
                        path: "ai-test",
                        element: <AITest />,
                    },
                    {
                        path: "flashcards",
                        element: <Flashcards />,
                    },
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
            }, 
            {
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
    {
        path: "api/v1/auth/google/callback",
        element: <GoogleOAuthProxy />,
    },

    // PHẦN ADMIN 
    {
        path: "/admin",
        // ĐÃ BẬT BẢO VỆ ADMIN: Chỉ Admin và Teacher mới được vào
        element: <AdminRoute />, 
        children: [
            {
                element: <AdminLayout />,
                children: [
                    { 
                        index: true, 
                        element: <Navigate to="dashboard" replace /> 
                    },
                    { 
                        path: "dashboard", 
                        element: <AdminDashboard /> 
                    },
                    { 
                        path: "users", 
                        element: <UserAdmin /> 
                    },
                    { 
                        path: "teacher-modules", 
                        element: <TeacherModules /> 
                    },
                    { 
                        path: "context", 
                        element: <ContextManager /> 
                    },
                    { 
                        path: "courses", 
                        element: <CourseAdmin /> 
                    },
                    { 
                        path: "orders", 
                        element: <OrderAdmin /> 
                    },
                    { 
                        path: "setuppayment", 
                        element: <SetupPayment /> 
                    },
                ]
            }
        ]
    },

    // 4. NHÓM AUTH (Không có Header/Footer)
    {
        path: "login",
        element: <Login />,
    },
    {
        path: "register",
        element: <Register />,
    },
    // 5. CATCH-ALL ROUTE CHO LỖI 404
    {
        path: "*",
        element: <NotFound />
    }
];