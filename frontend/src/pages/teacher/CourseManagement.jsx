import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Tag, message, Row, Col, Empty, Spin } from 'antd';
import { PlusOutlined, ReadOutlined, TeamOutlined } from '@ant-design/icons';
import api from '../../api';

const gradients = [
  'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #059669 0%, #10b981 100%)',
  'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
];

export default function CourseManagement() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses?per_page=100');
      setCourses(res.data.items);
    } catch {
      message.error('获取课程列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>课程管理</h2>
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => navigate('/teacher/courses/new')}>新建课程</Button>
      </div>

      <Spin spinning={loading}>
        {courses.length === 0 && !loading ? (
          <Card><Empty description="暂无课程，点击上方按钮创建" /></Card>
        ) : (
          <Row gutter={[20, 20]}>
            {courses.map((course, idx) => {
              const grad = gradients[idx % gradients.length];
              const classCount = course.classes?.length || 0;
              const studentCount = course.classes?.reduce((sum, c) => sum + (c.student_count || 0), 0) || 0;
              return (
                <Col key={course.id} xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    onClick={() => navigate(`/teacher/courses/${course.id}`)}
                    style={{
                      borderRadius: 16, overflow: 'hidden', border: 'none',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    }}
                    styles={{ body: { padding: 0 } }}
                  >
                    <div style={{
                      background: grad, padding: '24px 20px 16px', color: '#fff',
                    }}>
                      <ReadOutlined style={{ fontSize: 28, marginBottom: 8, display: 'block', opacity: 0.9 }} />
                      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{course.name}</div>
                      <div style={{ fontSize: 13, opacity: 0.85 }}>{course.teacher_name}</div>
                    </div>
                    <div style={{ padding: '14px 20px' }}>
                      <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 10, minHeight: 20 }}>
                        {course.description || '暂无描述'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {course.classes?.slice(0, 3).map(c => (
                            <Tag key={c.id} style={{ borderRadius: 6, margin: 0 }}>{c.class_name}</Tag>
                          ))}
                          {classCount > 3 && <Tag>+{classCount - 3}</Tag>}
                        </div>
                        <span style={{ color: '#9ca3af', fontSize: 12 }}>
                          <TeamOutlined style={{ marginRight: 2 }} />{studentCount}人
                        </span>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Spin>
    </div>
  );
}
