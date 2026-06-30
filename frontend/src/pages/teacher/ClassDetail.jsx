import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Upload, Modal, message, Tag, Space } from 'antd';
import { UploadOutlined, ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../api';

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importVisible, setImportVisible] = useState(false);

  const fetchClass = () => {
    setLoading(true);
    api.get(`/classes/${id}`)
      .then(res => setCls(res.data))
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClass(); }, [id]);

  const handleImport = (info) => {
    if (info.file.status === 'done') {
      const res = info.file.response;
      if (res.code === 200) {
        message.success(res.message);
        setImportVisible(false);
        fetchClass();
      } else {
        message.error(res.message);
      }
    }
  };

  const columns = [
    {
      title: '姓名', dataIndex: 'name', key: 'name',
      render: (t) => <span style={{ fontWeight: 500 }}>{t}</span>
    },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    {
      title: '注册时间', dataIndex: 'created_at', key: 'created_at', width: 180,
      render: (t) => new Date(t).toLocaleString('zh-CN')
    },
  ];

  if (!cls) return null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/teacher/classes')}>返回</Button>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{cls.name}</h2>
          <Tag color="blue">{cls.students?.length || 0} 人</Tag>
        </Space>
        <Button type="primary" icon={<UploadOutlined />} onClick={() => setImportVisible(true)}>
          导入学生名单
        </Button>
      </div>

      <Card>
        <Table
          dataSource={cls.students || []}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: '暂无学生，点击右上角按钮导入' }}
        />
      </Card>

      <Modal title="导入学生名单" open={importVisible} footer={null}
        onCancel={() => setImportVisible(false)}>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>
          上传 CSV 文件，格式：<code>username,name,password</code>（password 可省略，默认 123456）
        </p>
        <Upload accept=".csv" action={`/api/classes/${id}/import`}
          headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
          onChange={handleImport} maxCount={1}>
          <Button icon={<UploadOutlined />} type="primary">选择 CSV 文件</Button>
        </Upload>
      </Modal>
    </div>
  );
}
