'use client'

import { Layout, Menu, Typography, Button } from 'antd';
import {
  TableOutlined,
  CloudUploadOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const { Sider } = Layout;
const { Title } = Typography;

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      key: '/orders',
      icon: <TableOutlined />,
      label: '小包订单列表',
    },
    {
      key: '/import',
      icon: <CloudUploadOutlined />,
      label: '批量导入',
    },
    {
      key: '/tracking',
      icon: <SearchOutlined />,
      label: '快递追踪',
    },
    {
      key: '/settings',
      icon: <UserOutlined />,
      label: '账户管理',
    },
  ];

  return (
    <Sider
      width={260}
      theme="light"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
        zIndex: 100
      }}
    >
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <Title level={3} style={{ margin: 0, color: '#1890ff', letterSpacing: 1 }}>OMS</Title>
      </div>
      
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        items={menuItems}
        onClick={({ key }) => router.push(key)}
        style={{ borderRight: 0, padding: '0 8px' }}
      />
      
      <div style={{ position: 'absolute', bottom: 16, width: '100%', padding: '0 16px' }}>
        <Button 
          type="text" 
          icon={<LogoutOutlined />} 
          block 
          danger 
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{ height: 40, borderRadius: 8 }}
        >
          退出登录
        </Button>
      </div>
    </Sider>
  );
}
