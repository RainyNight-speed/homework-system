import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Descriptions, Button, Popconfirm, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import api from '../../api';

export default function History() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const fetchSubmissions = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/submissions?page=${page}&per_page=${pagination.pageSize}`);
      setSubmissions(res.data.items);
      setPagination(prev => ({ ...prev, current: res.data.page, total: res.data.total }));
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const handleWithdraw = async (id) => {
    try {
      await api.delete(`/submissions/${id}`);
      message.success('撤回成功');
      fetchSubmissions(pagination.current);
    } catch (err) {
      message.error(err.message || '撤回失败');
    }
  };

  const columns = [
    {
      title: '提交内容', dataIndex: 'content', key: 'content', ellipsis: true,
      render: (t) => t ? t.substring(0, 60) + '...' : '-'
    },
    {
      title: '提交时间', dataIndex: 'submitted_at', key: 'submitted_at', width: 180,
      render: (t) => new Date(t).toLocaleString('zh-CN')
    },
    {
      title: '状态', dataIndex: 'is_late', key: 'is_late', width: 80,
      render: (late) => late ? <Tag color="orange">逾期</Tag> : <Tag color="green">正常</Tag>
    },
    { title: '附件', dataIndex: 'file_path', key: 'file_path', render: (f) => f ? '有' : '无' },
    {
      title: '操作', key: 'action', width: 100,
      render: (_, record) => (
        <Popconfirm title="确认撤回此提交？撤回后可重新提交。" onConfirm={() => handleWithdraw(record.id)}>
          <Button size="small" danger icon={<DeleteOutlined />}>撤回</Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <Card title="我的提交记录">
      <Table
        dataSource={submissions}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ ...pagination, showTotal: (total) => `共 ${total} 条` }}
        onChange={(pag) => fetchSubmissions(pag.current)}
        expandable={{
          expandedRowRender: (record) => (
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="完整内容">{record.content || '无'}</Descriptions.Item>
              {record.file_path && (
                <Descriptions.Item label="附件">
                  <a href={`/api/submissions/files/${record.file_path}`} target="_blank" rel="noreferrer">
                    下载附件
                  </a>
                </Descriptions.Item>
              )}
            </Descriptions>
          )
        }}
      />
    </Card>
  );
}
