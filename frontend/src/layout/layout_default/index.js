import React, { useState, useEffect } from 'react';
import { Row, Col, Avatar, Space, Dropdown, Button, Modal, Input, message, Drawer } from "antd";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
    FacebookFilled, YoutubeFilled, InstagramFilled,
    MailOutlined, PhoneOutlined,
    LogoutOutlined, UserOutlined, DownOutlined, MenuOutlined,
    SafetyCertificateFilled, FireFilled
} from '@ant-design/icons';

import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/authSlice';
import AIAssistantDrawer from '../../components/AIAssistantDrawer';
import { flashcardService } from '../../services/flashcardService';

import './style.scss';

function Layout() {
    const { isLogin, user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    // Logic: Chỉ hiện Footer ở trang chủ
    const isHomePage = location.pathname === "/";

    // Global Flashcard State
    const [selectedWord, setSelectedWord] = useState('');
    const [isFlashcardModalVisible, setIsFlashcardModalVisible] = useState(false);
    const [meaning, setMeaning] = useState('');
    
    // Mobile Menu State
    const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(false);

    useEffect(() => {
        const handleMouseUp = () => {
            const selection = window.getSelection().toString().trim();
            // Validate: not empty, length < 50
            if (selection && selection.length > 0 && selection.length < 50) {
                setSelectedWord(selection);
                setIsFlashcardModalVisible(true);
            }
        };
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const handleSaveFlashcard = async () => {
        try {
            const res = await flashcardService.addFlashcard({ word: selectedWord, meaning });
            if (res.success) {
                message.success('Đã lưu vào Flashcard!');
                setIsFlashcardModalVisible(false);
                setMeaning('');
            }
        } catch (err) {
            message.error(err.response?.data?.error || 'Lỗi khi lưu flashcard');
        }
    };

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
                                    <Space size="large" style={{ display: 'flex', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', color: '#ff4d4f', fontWeight: 'bold', fontSize: '16px' }} title="Chuỗi ngày học liên tiếp">
                                            <FireFilled style={{ fontSize: 20, marginRight: 4 }} />
                                            {user?.currentStreak || 0}
                                        </div>
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
                                    </Space>
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

                            <Button 
                                className="layout__mobile-menu-btn" 
                                type="text" 
                                icon={<MenuOutlined style={{ fontSize: '24px' }}/>} 
                                onClick={() => setIsMobileMenuVisible(true)} 
                            />
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

                {/* Global AI Assistant Drawer */}
                <AIAssistantDrawer courseTitle="Tiếng Anh Tổng Quát" moduleTitle="Website" />

                {/* Global Flashcard Modal */}
                <Modal
                    title="Lưu Flashcard Từ Vựng"
                    open={isFlashcardModalVisible}
                    onOk={handleSaveFlashcard}
                    onCancel={() => {
                        setIsFlashcardModalVisible(false);
                        setMeaning('');
                    }}
                    okText="Lưu lại"
                    cancelText="Hủy"
                    zIndex={10000}
                >
                    <div style={{ marginBottom: 16 }}>
                        <strong>Từ vựng: </strong> <span style={{ fontSize: 18, color: '#1890ff' }}>{selectedWord}</span>
                    </div>
                    <div>
                        <Input.TextArea 
                            placeholder="Nhập nghĩa của từ hoặc ghi chú..." 
                            value={meaning}
                            onChange={e => setMeaning(e.target.value)}
                            rows={4}
                        />
                    </div>
                </Modal>

                {/* Mobile Drawer Menu */}
                <Drawer
                    title="Menu"
                    placement="right"
                    onClose={() => setIsMobileMenuVisible(false)}
                    open={isMobileMenuVisible}
                    width={280}
                    className="mobile-drawer-menu"
                >
                    <nav className="mobile-menu-nav">
                        <ul>
                            <li><NavLink to="/" onClick={() => setIsMobileMenuVisible(false)}>Trang chủ</NavLink></li>
                            <li><NavLink to="/courses" onClick={() => setIsMobileMenuVisible(false)}>Khóa học</NavLink></li>
                            <li><NavLink to="/conversation" onClick={() => setIsMobileMenuVisible(false)}>Luyện hội thoại</NavLink></li>
                            {isLogin && <li><NavLink to="/mindmap" onClick={() => setIsMobileMenuVisible(false)}>Từ vựng</NavLink></li>}
                            {isLogin && <li><NavLink to="/chatbox" onClick={() => setIsMobileMenuVisible(false)}>Chat Box</NavLink></li>}
                            
                            <div className="mobile-menu-divider"></div>
                            
                            {isLogin ? (
                                <>
                                    <li><NavLink to="/profile" onClick={() => setIsMobileMenuVisible(false)}>Hồ sơ cá nhân</NavLink></li>
                                    <li><NavLink to="/my-courses" onClick={() => setIsMobileMenuVisible(false)}>Khóa học của tôi</NavLink></li>
                                    <li onClick={() => { setIsMobileMenuVisible(false); handleLogout(); }} style={{ color: 'red', cursor: 'pointer', marginTop: 15 }}>
                                        <LogoutOutlined /> Đăng xuất
                                    </li>
                                </>
                            ) : (
                                <div className="mobile-auth-buttons">
                                    <NavLink to="/login" onClick={() => setIsMobileMenuVisible(false)}>
                                        <Button type="default" block style={{ marginBottom: 10 }}>Đăng nhập</Button>
                                    </NavLink>
                                    <NavLink to="/register" onClick={() => setIsMobileMenuVisible(false)}>
                                        <Button type="primary" block>Đăng ký miễn phí</Button>
                                    </NavLink>
                                </div>
                            )}
                        </ul>
                    </nav>
                </Drawer>
            </div>
        </>
    );
}

export default Layout;