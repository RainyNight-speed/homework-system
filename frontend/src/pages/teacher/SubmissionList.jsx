import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Tag, message, Row, Col, Statistic, Space, Progress } from 'antd';
import { EditOutlined, ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import api from '../../api';

export default function SubmissionList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/submissions?assignment_id=${id}&per_page=200`),
      api.get(`/statistics/assignment/${id}`).catch(() => ({ data: null })),
    ]).then(([subRes, statsRes]) => {
      setSubmissions(subRes.data.items);
      setStats(statsRes.data);
    }).catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  const submittedCount = stats?.submitted_count ?? submissions.length;
  const totalCount = stats?.total_students ?? submittedCount;
  const gradedCount = stats?.graded_count ?? 0;
  const avgScore = stats?.avg_score;
  const lateCount = submissions.filter(s => s.is_late).length;

  const columns = [
    { title: '学生姓名', dataIndex: 'student_name', key: 'student_name', width: 120 },
    {
      title: '提交内容', dataIndex: 'content', key: 'content', ellipsis: true,
      render: (t) => t ? t.substring(0, 50) + '...' : '-'
    },
    {
      title: '提交时间', dataIndex: 'submitted_at', key: 'submitted_at', width: 180,
      render: (t) => new Date(t).toLocaleString('zh-CN')
    },
    {
      title: '状态', dataIndex: 'is_late', key: 'is_late', width: 80,
      render: (late) => late
        ? <Tag icon={<ClockCircleOutlined />} color="warning">逾期</Tag>
        : <Tag icon={<CheckCircleOutlined />} color="success">正常</Tag>
    },
    {
      title: '操作', key: 'action', width: 100,
      render: (_, record) => (
        <Button size="small" type="primary" icon={<EditOutlined />}
          onClick={() => navigate(`/teacher/assignments/${id}/grade/${record.id}`)}>
          批改
        </Button>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/teacher/assignments')}
          style={{ marginBottom: 12 }}>返回作业列表</Button>
      </div>

      {/* 提交总览看板 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, borderLeft: '4px solid #4f46e5' }}>
            <Statistic title="总学生数" value={totalCount} suffix="人"
              valueStyle={{ color: '#4f46e5', fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, borderLeft: '4px solid #059669' }}>
            <Statistic title="已提交" value={submittedCount} suffix="人"
              valueStyle={{ color: '#059669', fontWeight: 700 }} />
            <div style={{ marginTop: 4 }}>
              <Progress percent={totalCount ? Math.round(submittedCount / totalCount * 100) : 0}
                size="small" strokeColor="#059669" showInfo={false} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, borderLeft: '4px solid #d97706' }}>
            <Statistic title="已批改" value={gradedCount} suffix="人"
              valueStyle={{ color: '#d97706', fontWeight: 700 }} />
            <div style={{ marginTop: 4, fontSize: 12, color: '#9ca3af' }}>
              逾期提交：{lateCount} 人
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, borderLeft: '4px solid #dc2626' }}>
            <Statistic title="平均分" value={avgScore ?? '-'}
              valueStyle={{ color: '#dc2626', fontWeight: 700 }} />
            <div style={{ marginTop: 4, fontSize: 12, color: '#9ca3af' }}>
              未提交：{totalCount - submittedCount} 人
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="学生提交明细" style={{ borderRadius: 12 }}>
        <Table
          dataSource={submissions}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </div>
  );
}
