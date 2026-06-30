import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Space, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, EyeOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import api from '../../api';

export default function AssignmentList() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const fetchList = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/assignments?page=${page}&per_page=${pagination.pageSize}`);
      setList(res.data.items);
      setPagination(prev => ({ ...prev, current: res.data.page, total: res.data.total }));
    } catch {
      message.error('获取作业列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/assignments/${id}`);
      message.success('删除成功');
      fetchList(pagination.current);
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '课程', key: 'course', width: 150,
      render: (_, r) => r.course_name ? <Tag color="blue">{r.course_name}</Tag> : '-'
    },
    {
      title: '班级', key: 'class_name', width: 120,
      render: (_, r) => r.class_name || '-'
    },
    { title: '满分', dataIndex: 'max_score', key: 'max_score', width: 80 },
    {
      title: '截止时间', dataIndex: 'due_date', key: 'due_date', width: 180,
      render: (t) => new Date(t).toLocaleString('zh-CN')
    },
    {
      title: '发布时间', dataIndex: 'created_at', key: 'created_at', width: 180,
      render: (t) => new Date(t).toLocaleString('zh-CN')
    },
    {
      title: '操作', key: 'action', width: 280,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />}
            onClick={() => navigate(`/teacher/assignments/${record.id}/submissions`)}>
            查看提交
          </Button>
          <Button size="small" icon={<EditOutlined />}
            onClick={() => navigate(`/teacher/assignments/${record.id}/edit`)}>
            编辑
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const handleTableChange = (pag) => {
    fetchList(pag.current);
  };

  return (
    <Card title="作业列表" extra={
      <Button type="primary" icon={<PlusOutlined />}
        onClick={() => navigate('/teacher/assignments/new')}>
        发布作业
      </Button>
    }>
      <Table
        dataSource={list}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ ...pagination, showTotal: (total) => `共 ${total} 条` }}
        onChange={handleTableChange}
      />
    </Card>
  );
}
