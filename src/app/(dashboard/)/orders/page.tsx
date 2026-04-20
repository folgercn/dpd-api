'use client'

import { useState, useEffect } from 'react';
import { 
  Table, 
  Tag, 
  Space, 
  Button, 
  Typography, 
  Card, 
  message,
  Input,
  Tooltip,
  Modal,
  Divider
} from 'antd';
import { 
  ReloadOutlined, 
  PlayCircleOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // 10秒自动刷新
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/orders');
      setOrders(res.data);
    } catch (err) {
      // 静默失败，避免自动刷新时频繁弹窗
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const config: any = {
      PENDING: { color: 'default', text: '待处理', icon: <SyncOutlined /> },
      QUEUED: { color: 'blue', text: '队列中', icon: <SyncOutlined spin /> },
      PROCESSING: { color: 'processing', text: '出单中', icon: <SyncOutlined spin /> },
      SUCCESS: { color: 'success', text: '已出单', icon: <CheckCircleOutlined /> },
      FAILED: { color: 'error', text: '失败', icon: <ExclamationCircleOutlined /> },
    };
    const s = config[status] || { color: 'default', text: status };
    return <Tag icon={s.icon} color={s.color}>{s.text}</Tag>;
  };

  const columns = [
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (t: string) => dayjs(t).format('MM-DD HH:mm'),
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => getStatusTag(s),
      width: 100
    },
    {
      title: '收件人',
      dataIndex: 'recipientName',
      key: 'recipientName',
      render: (name: string, record: any) => (
        <Tooltip title={`${record.recipientAddress}, ${record.recipientCity} ${record.recipientZip}`}>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.recipientCountry}</Text>
        </Tooltip>
      ),
    },
    {
      title: '重量',
      dataIndex: 'weight',
      key: 'weight',
      render: (w: number) => `${w}kg`,
      width: 80
    },
    {
      title: 'DPD 账号',
      dataIndex: 'dpdAccount',
      key: 'dpdAccount',
      render: (a: any) => a?.accountName,
    },
    {
      title: '快递单号',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      render: (n: string) => n ? <Text copyable style={{ color: '#1890ff', fontWeight: 'bold' }}>{n}</Text> : '-',
    },
    {
      title: '备注/错误',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      render: (msg: string) => msg ? <Text type="danger" style={{ fontSize: 12 }}>{msg}</Text> : '-',
      width: 150,
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="text" icon={<EyeOutlined />} onClick={() => showDetails(record)} />
        </Space>
      ),
      width: 80
    },
  ];

  const showDetails = (order: any) => {
    Modal.info({
      title: '订单详情',
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <Text strong>发件人信息：</Text>
          <p>{order.senderName} - {order.senderPhone}<br />{order.senderAddress}, {order.senderCity} {order.senderZip}</p>
          <Divider style={{ margin: '8px 0' }} />
          <Text strong>收件人信息：</Text>
          <p>{order.recipientName} - {order.recipientPhone}<br />{order.recipientAddress}, {order.recipientCity} {order.recipientZip}</p>
          <Divider style={{ margin: '8px 0' }} />
          <Text strong>包裹信息：</Text>
          <p>重量: {order.weight}kg | 数量: {order.quantity} | SKU: {order.sku || '无'}</p>
        </div>
      ),
    });
  };

  const startProcessing = async () => {
    try {
      setLoading(true);
      const res = await axios.post('/api/orders/start', {});
      message.success(`已成功将 ${res.data.count} 个订单加入队列！`);
      fetchOrders();
    } catch (err: any) {
      message.error(err.response?.data?.error || '启动失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>小包订单管理</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchOrders} loading={loading}>刷新</Button>
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />} 
            onClick={startProcessing}
            loading={loading}
          >
            开始批量出单
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table 
          dataSource={orders} 
          columns={columns} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 15 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
