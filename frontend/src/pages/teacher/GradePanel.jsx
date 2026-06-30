import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Button, Descriptions, Tag, Spin, message, Row, Col } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import api from '../../api';

export default function GradePanel() {
  const { id, sid } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [grade, setGrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    api.get(`/submissions?assignment_id=${id}&per_page=100`)
      .then(subRes => {
        const sub = subRes.data.items.find(s => s.id === parseInt(sid));
        setSubmission(sub);
      })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  }, [id, sid]);

  const handleGrade = async (values) => {
    try {
      const res = await api.post(`/grades/${sid}`, values);
      setGrade(res.data);
      message.success('批改成功');
    } catch (err) {
      message.error(err.message || '批改失败');
    }
  };

  const handleAiGrade = async () => {
    setAiLoading(true);
    try {
      const res = await api.post(`/grades/${sid}/ai`);
      setGrade(res.data);
      message.success('AI批改完成');
    } catch (err) {
      message.error(err.message || 'AI批改失败');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <Row gutter={16}>
      <Col span={14}>
        <Card title="学生提交内容">
          {submission && (
            <>
              <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="学生">{submission.student_name}</Descriptions.Item>
                <Descriptions.Item label="提交时间">{new Date(submission.submitted_at).toLocaleString('zh-CN')}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  {submission.is_late ? <Tag color="red">逾期</Tag> : <Tag color="green">正常</Tag>}
                </Descriptions.Item>
              </Descriptions>
              <Card type="inner" title="提交内容" style={{ background: '#fafafa' }}>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {submission.content || '（无文本内容）'}
                </pre>
              </Card>
            </>
          )}
        </Card>
      </Col>
      <Col span={10}>
        <Card title="批改面板" extra={
          <Button type="primary" icon={<RobotOutlined />} loading={aiLoading}
            onClick={handleAiGrade} disabled={!submission?.content}>
            AI自动批改
          </Button>
        }>
          <Form layout="vertical" onFinish={handleGrade}>
            <Form.Item name="score" label="教师评分" rules={[{ required: true, message: '请输入分数' }]}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="comment" label="教师评语">
              <Input.TextArea rows={4} placeholder="请输入评语" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>提交批改</Button>
            </Form.Item>
          </Form>
          {grade && (
            <Card type="inner" title="批改结果" style={{ marginTop: 16 }}>
              {grade.score !== null && <p><strong>教师评分：</strong>{grade.score}</p>}
              {grade.teacher_comment && <p><strong>教师评语：</strong>{grade.teacher_comment}</p>}
              {grade.ai_score !== null && <p><strong>AI评分：</strong>{grade.ai_score}</p>}
              {grade.ai_comment && <p><strong>AI评语：</strong>{grade.ai_comment}</p>}
            </Card>
          )}
          <Button style={{ marginTop: 16 }} onClick={() => navigate(`/teacher/assignments/${id}/submissions`)}>
            返回提交列表
          </Button>
        </Card>
      </Col>
    </Row>
  );
}
