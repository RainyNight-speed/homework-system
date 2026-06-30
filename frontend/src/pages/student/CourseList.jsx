import React, { useEffect, useState } from 'react';
import { Card, Tag, message, Row, Col, Empty, Spin } from 'antd';
import { ReadOutlined, TeamOutlined } from '@ant-design/icons';
import api from '../../api';

const gradients = [
  'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #059669 0%, #10b981 100%)',
  'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
];

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/courses')
      .then(res => setCourses(res.data.items))
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 600 }}>我的课程</h2>

      <Spin spinning={loading}>
        {courses.length === 0 && !loading ? (
          <Card><Empty description="暂无课程" /></Card>
        ) : (
          <Row gutter={[20, 20]}>
            {courses.map((course, idx) => {
              const grad = gradients[idx % gradients.length];
              return (
                <Col key={course.id} xs={24} sm={12} md={8}>
                  <Card
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
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {course.classes?.map(c => (
                          <Tag key={c.id} style={{ borderRadius: 6, margin: 0 }}>{c.class_name}</Tag>
                        ))}
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
