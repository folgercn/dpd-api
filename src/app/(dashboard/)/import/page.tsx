'use client'

import { useState, useEffect } from 'react';
import { 
  Typography, 
  Select, 
  Upload, 
  Button, 
  message, 
  Card, 
  Space, 
  Divider,
  Alert
} from 'antd';
import { InboxOutlined, CloudUploadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

export default function ImportPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>();
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get('/api/accounts');
      setAccounts(res.data);
      if (res.data.length > 0) {
        setSelectedAccountId(res.data[0].id);
      }
    } catch (err) {
      message.error('加载 DPD 账号失败');
    }
  };

  const handleUpload = async () => {
    if (!selectedAccountId) {
      message.warning('请先选择 DPD 账号');
      return;
    }
    if (fileList.length === 0) {
      message.warning('请选择需要上传的 Excel 文件');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileList[0].originFileObj);
    formData.append('dpdAccountId', selectedAccountId);

    setUploading(true);
    try {
      const res = await axios.post('/api/import', formData);
      message.success(`导入成功！共计 ${res.data.count} 条订单。批次号：${res.data.batchId}`);
      setFileList([]);
    } catch (err: any) {
      message.error(err.response?.data?.error || '导入失败，请检查文件格式');
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    onRemove: (file: any) => {
      setFileList([]);
    },
    beforeUpload: (file: any) => {
      setFileList([file]);
      return false;
    },
    fileList,
    accept: ".xlsx, .xls",
    maxCount: 1
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>批量导入订单</Title>
      <Paragraph type="secondary">
        请选择 DPD 账号并上传包含订单信息的 Excel 文件。系统会自动识别以下格式：
      </Paragraph>
      <Alert
        message="支持格式说明"
        description={
          <ul>
            <li><strong>兴麦专用格式：</strong> 包含“收件人姓名”、“重量(kg)”等详细列的宽表。</li>
            <li><strong>DPD 万能格式：</strong> 包含“退货人信息”、“发件人信息”（地址块）的紧凑表。</li>
          </ul>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Card style={{ borderRadius: 12 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>1. 选择下单 DPD 账号</Text>
            <div style={{ marginTop: 8 }}>
              <Select
                placeholder="选择 DPD 账号"
                style={{ width: '100%' }}
                value={selectedAccountId}
                onChange={setSelectedAccountId}
                options={accounts.map(a => ({ value: a.id, label: `${a.accountName} (${a.dpdUsername})` }))}
              />
            </div>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <Text strong>2. 上传 Excel 文件</Text>
            <div style={{ marginTop: 8 }}>
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此区域进行上传</p>
                <p className="ant-upload-hint">
                  支持 .xlsx 和 .xls 格式单个文件。
                </p>
              </Dragger>
            </div>
          </div>

          <Button 
            type="primary" 
            size="large" 
            icon={<CloudUploadOutlined />} 
            onClick={handleUpload} 
            loading={uploading}
            block
            style={{ height: 54, borderRadius: 8, fontSize: 18 }}
          >
            开始导入并准备下单
          </Button>
        </Space>
      </Card>
    </div>
  );
}
