import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Tag, message } from 'antd';
import { EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import Countdown from '../../components/Countdown';
import api from '../../api';

export default function AssignmentList() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/assignments?per_page=100'),
      api.get('/submissions?per_page=100'),
    ]).then(([assignRes, subRes]) => {
      setAssignments(assignRes.data.items);
      setSubmissions(subRes.data.items);
    }).catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  }, []);

  const getSubmission = (assignmentId) =>
    submissions.find(s => s.assignment_id === assignmentId);

  const columns = [
    { title: '作业标题', dataIndex: 'title', key: 'title' },
    {
      title: '课程', key: 'course', width: 120,
      render: (_, r) => r.course_name ? <Tag color="blue">{r.course_name}</Tag> : '-'
    },
    { title: '满分', dataIndex: 'max_score', key: 'max_score', width: 80 },
    {
      title: '截止时间', dataIndex: 'due_date', key: 'due_date', width: 180,
      render: (t) => new Date(t).toLocaleString('zh-CN')
    },
    {
      title: '剩余时间', dataIndex: 'due_date', key: 'countdown', width: 150,
      render: (t) => <Countdown dueDate={t} />
    },
    {
      title: '状态', key: 'status', width: 120,
      render: (_, record) => {
        const sub = getSubmission(record.id);
        if (sub) {
          return sub.is_late
            ? <Tag color="orange">已提交(逾期)</Tag>
            : <Tag color="green" icon={<CheckCircleOutlined />}>已提交</Tag>;
        }
        return <Tag color="default">未提交</Tag>;
      }
    },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, record) => {
        const sub = getSubmission(record.id);
        const isExpired = new Date(record.due_date) <= new Date();
        if (sub && !isExpired) {
          return (
            <Button size="small" icon={<EditOutlined />}
              onClick={() => navigate(`/student/assignments/${record.id}/submit`)}>
              修改
            </Button>
          );
        }
        if (sub) {
          return <Tag color="blue">已提交</Tag>;
        }
        if (isExpired) {
          return <Tag color="red">已截止</Tag>;
        }
        return (
          <Button size="small" type="primary" icon={<EditOutlined />}
            onClick={() => navigate(`/student/assignments/${record.id}/submit`)}>
            提交
          </Button>
        );
      }
    }
  ];

  return (
    <Card title="作业列表">
      <Table dataSource={assignments} columns={columns} rowKey="id" loading={loading} />
    </Card>
  );
}
