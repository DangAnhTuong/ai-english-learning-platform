import React from 'react';
import { Row, Col, Avatar, Space, Dropdown, Button } from "antd";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
    FacebookFilled, YoutubeFilled, InstagramFilled,
    MailOutlined, PhoneOutlined,
    LogoutOutlined, UserOutlined, DownOutlined,
    SafetyCertificateFilled
} from '@ant-design/icons';

import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/authSlice';

import './style.scss';

function Layout() {
    const { isLogin, user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    // Logic: Chỉ hiện Footer ở trang chủ
    const isHomePage = location.pathname === "/";

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    const userMenu = [
        {
            key: '1',
            label: <NavLink to="/profile">Hồ sơ cá nhân</NavLink>,
        },
        {
            key: '2',
            label: <NavLink to="/my-courses">Khóa học của tôi</NavLink>,
        },
        {
            type: 'divider',
        },
        {
            key: '3',
            label: (
                <div onClick={handleLogout} style={{ color: 'red', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <LogoutOutlined /> Đăng xuất
                </div>
            ),
        },
    ];

    return (
        <>
            <div className="body">
                <div className="layout__default" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

                    {/* --- HEADER --- */}
                    <header className="layout__header">
                        <div className="layout__header-container">

                            <div className="layout__logo">
                                <NavLink to="/">English AI</NavLink>
                            </div>

                            <nav className="layout__menu">
                                <ul>
                                    <li><NavLink to="/">Trang chủ</NavLink></li>
                                    <li><NavLink to="/courses">Khóa học</NavLink></li>
                                    <li><NavLink to="/conversation">Luyện hội thoại</NavLink></li>
                                    {isLogin && <li><NavLink to="/mindmap">Từ vựng</NavLink></li>}
                                    {isLogin && <li><NavLink to="/chatbox">Chat Box</NavLink></li>}
                                </ul>
                            </nav>

                            <div className="layout__auth">
                                {isLogin ? (
                                    <Dropdown
                                        menu={{ items: userMenu }}
                                        placement="bottomRight"
                                        trigger={['click']}
                                    >
                                        <Space className="user-info" style={{ cursor: 'pointer', userSelect: 'none' }}>
                                            <Avatar
                                                src={user?.avatar}
                                                style={{ backgroundColor: '#0075F3' }}
                                                icon={<UserOutlined />}
                                            />
                                            <span className="user-name">
                                                {user?.name || "Học viên"} <DownOutlined style={{ fontSize: '12px' }} />
                                            </span>
                                        </Space>
                                    </Dropdown>
                                ) : (
                                    <div className="auth-buttons">
                                        <NavLink to="/login" className="link-login">Đăng nhập</NavLink>
                                        <NavLink to="/register">
                                            <Button type="primary" shape="round" className="btn-register">
                                                Đăng ký miễn phí
                                            </Button>
                                        </NavLink>
                                    </div>
                                )}
                            </div>

                        </div>
                    </header>

                    <div style={{ height: '80px' }}></div>

                    <main className="layout__main" style={{ flex: 1 }}>
                        <Outlet />
                    </main>

                    {/* --- FOOTER (Chỉ hiện ở Trang Chủ) --- */}
                    {isHomePage && (
                        <footer className="layout__footer">
                            <div className="layout__footer-container">

                                <div className="footer-top">
                                    <Row gutter={[40, 40]}>
                                        <Col xs={24} sm={12} md={7}>
                                            <div className="layout__footer-logo" style={{ color: '#0075F3', fontSize: '28px', fontWeight: 'bold', marginBottom: '15px' }}>
                                                English AI
                                            </div>
                                            <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                                                Nền tảng học tiếng Anh trực tuyến ứng dụng công nghệ AI, giúp học viên tối ưu hóa lộ trình và bứt phá kỹ năng giao tiếp.
                                            </p>
                                            <h4>KẾT NỐI VỚI CHÚNG TÔI</h4>
                                            <Space size="middle">
                                                <a href="https://www.facebook.com/share/1BkWQyVW9P/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">
                                                    <Button shape="circle" icon={<FacebookFilled />} />
                                                </a>
                                                <a href="https://www.youtube.com/@englishAiiii" target="_blank" rel="noopener noreferrer">
                                                    <Button shape="circle" icon={<YoutubeFilled />} />
                                                </a>
                                                <a href="https://www.instagram.com/englishaiiii?igsh=d2J3b2dxYTQ5Y2N6&utm_source=qr" target="_blank" rel="noopener noreferrer">
                                                    <Button shape="circle" icon={<InstagramFilled />} />
                                                </a>
                                            </Space>
                                        </Col>

                                        <Col xs={24} sm={12} md={5}>
                                            <h4>CHƯƠNG TRÌNH HỌC</h4>
                                            <ul className="footer-links">
                                                <li><NavLink to="/conversation">Luyện hội thoại AI</NavLink></li>
                                                <li><NavLink to="/mindmap">Từ vựng Mindmap</NavLink></li>
                                                <li><NavLink to="/chatbox">Trò chuyện Chat Box</NavLink></li>
                                            </ul>
                                        </Col>

                                        <Col xs={24} sm={12} md={6}>
                                            <h4>HỖ TRỢ KHÁCH HÀNG</h4>
                                            <ul className="footer-links">
                                                <li><NavLink to="/guide">Hướng dẫn học tập</NavLink></li>
                                                <li><NavLink to="/activate">Kích hoạt mã Premium</NavLink></li>
                                                <li><NavLink to="/faq">Câu hỏi thường gặp (FAQs)</NavLink></li>
                                                <li><NavLink to="/refund-policy">Chính sách hoàn tiền</NavLink></li>
                                            </ul>
                                        </Col>

                                        <Col xs={24} sm={12} md={6}>
                                            <h4>VỀ CHÚNG TÔI</h4>
                                            <ul className="footer-links">
                                                <li><NavLink to="/about">Câu chuyện thương hiệu</NavLink></li>
                                                <li><NavLink to="/privacy-policy">Chính sách bảo mật</NavLink></li>
                                                <li><NavLink to="/terms-of-service">Điều khoản dịch vụ</NavLink></li>
                                                <li><NavLink to="/contact">Liên hệ</NavLink></li>
                                            </ul>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="footer-divider"></div>

                                <div className="footer-bottom">
                                    <Row gutter={[40, 20]}>
                                        <Col xs={24} md={14}>
                                            <h5>CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC ENGLISH AI</h5>
                                            <p><strong>Mã số doanh nghiệp:</strong> 0123456789 do Sở Kế hoạch và Đầu tư TP.HCM cấp.</p>
                                            <p><strong>Địa chỉ:</strong> Tòa nhà English AI, Đặng Thùy Trâm, Phường 13, Quận Bình Thạnh, TP. Hồ Chí Minh.</p>
                                            <p><strong>Đại diện pháp luật:</strong> Lê Trí Thiện</p>
                                        </Col>
                                        <Col xs={24} md={10}>
                                            <h5>TRUNG TÂM NGOẠI NGỮ ENGLISH AI</h5>
                                            <p><PhoneOutlined /> <strong>Hotline:</strong> +84 942334470 (8:00 - 21:00)</p>
                                            <p><MailOutlined /> <strong>Email:</strong> letrithieng@gmail.com</p>
                                            <div className="cert-logos">
                                                <Space size="large">
                                                    <div className="bct-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <SafetyCertificateFilled style={{ fontSize: 28, color: '#13c2c2' }} />
                                                        <span style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG</span>
                                                    </div>
                                                </Space>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="layout__footer-copyright" style={{ textAlign: 'center', marginTop: '30px', color: '#bbb', fontSize: '12px' }}>
                                    © 2025 English AI. All rights reserved. @Copyright by Team
                                </div>
                            </div>
                        </footer>
                    )}
                </div>
            </div>
        </>
    );
}

export default Layout;