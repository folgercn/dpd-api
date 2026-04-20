'use client'

import { Layout } from 'antd';
import Sidebar from '@/components/Sidebar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const { Content } = Layout;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>加载中...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout style={{ marginLeft: 260, minHeight: '100vh', transition: 'margin-left 0.2s' }}>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', borderRadius: 12, minHeight: 280, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="animate-fade-in">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
