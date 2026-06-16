// File: src/layout/AdminLayout.jsx
import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, theme, Avatar, Space, Typography, ConfigProvider } from 'antd';

import {
  UserOutlined,
  MessageOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  ShoppingCartOutlined,
  BankOutlined,
  BookOutlined,
  DashboardOutlined,
  TeamOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // --- 2. CẬP NHẬT LOGIC ACTIVE MENU ---
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return '0';
    if (path.includes('/admin/users')) return '1';
    if (path.includes('/admin/teacher-modules')) return '2';
    if (path.includes('/admin/context')) return '3';
    if (path.includes('/admin/courses')) return '4';
    if (path.includes('/admin/orders')) return '5';
    if (path.includes('/admin/setuppayment')) return '6';
    return '0';
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#13c2c2',
          borderRadius: 8,
          colorBgLayout: '#f6ffed',
        },
        components: {
          Layout: {
            siderBg: '#ffffff',
            triggerBg: '#13c2c2',
          },
          Menu: {
            itemSelectedBg: '#e6fffb',
            itemSelectedColor: '#13c2c2',
          }
        }
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={240}
          style={{
            boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
            zIndex: 10
          }}
        >
          <div style={{ height: 64, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
            <Title level={4} style={{ color: '#13c2c2', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {collapsed ? 'EA' : 'English AI'}
            </Title>
          </div>

          <Menu
            mode="inline"
            defaultSelectedKeys={[getSelectedKey()]}
            selectedKeys={[getSelectedKey()]}
            style={{ borderRight: 0 }}
            items={[
              {
                key: '0',
                icon: <DashboardOutlined />,
                label: <Link to="/admin/dashboard">Tổng quan</Link>
              },
              {
                key: '1',
                icon: <TeamOutlined />,
                label: <Link to="/admin/users">Quản lý Người dùng</Link>
              },
              {
                key: '2',
                icon: <MessageOutlined />,
                label: <Link to="/admin/teacher-modules">Hội thoại & Từ điển</Link>
              },
              {
                key: '3',
                icon: <AppstoreOutlined />,
                label: <Link to="/admin/context">Gói học & Topic</Link>
              },
              {
                key: '4',
                icon: <BookOutlined />,
                label: <Link to="/admin/courses">Quản lý Khóa học</Link>
              },
              {
                key: '5',
                icon: <ShoppingCartOutlined />,
                label: <Link to="/admin/orders">Đơn hàng & Doanh thu</Link>
              },
              {
                key: '6',
                icon: <BankOutlined />,
                label: <Link to="/admin/setuppayment">Cấu hình Thanh toán</Link>
              }
            ]}
          />
        </Sider>

        <Layout className="site-layout" style={{ background: '#f5f5f5' }}>
          <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: () => setCollapsed(!collapsed),
              style: { fontSize: '18px', cursor: 'pointer', color: '#13c2c2' }
            })}
            <Space>
              <Space style={{ marginRight: 16 }}>
                <Avatar style={{ backgroundColor: '#13c2c2' }} icon={<UserOutlined />} />
                <span style={{ fontWeight: 500, color: '#555' }}>Admin</span>
              </Space>
              <Button type="text" icon={<LogoutOutlined style={{ color: '#ff7875' }} />} onClick={() => navigate('/login')}>
                Thoát
              </Button>
            </Space>
          </Header>

          <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: 'transparent' }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default AdminLayout;