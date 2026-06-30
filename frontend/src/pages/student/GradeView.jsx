import React, { useEffect, useState } from 'react';
import { Card, Tag, message, Row, Col, Empty, Spin, Progress, Tooltip } from 'antd';
import { TrophyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import api from '../../api';

export default function GradeView() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    setLoading(true);
    api.get(`/statistics/student/${user.id}`)
      .then(res => setGrades(res.data))
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  }, [user.id]);

  const getScoreColor = (score) => {
    if (score >= 90) return '#059669';
    if (score >= 60) return '#4f46e5';
    return '#dc2626';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 60) return '及格';
    if (score !== null && score !== undefined) return '不及格';
    return '';
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 600 }}>我的成绩</h2>

      <Spin spinning={loading}>
        {grades.length === 0 && !loading ? (
          <Card><Empty description="暂无成绩数据" /></Card>
        ) : (
          <Row gutter={[16, 16]}>
            {grades.map((item, idx) => {
              const hasScore = item.score !== null && item.score !== undefined;
              const color = hasScore ? getScoreColor(item.score) : '#d1d5db';
              return (
                <Col key={idx} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    hoverable
                    style={{ borderRadius: 12, borderTop: `3px solid ${color}` }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, lineHeight: 1.4 }}>
                      {item.title}
                    </div>

                    {hasScore ? (
                      <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <Progress
                          type="circle"
                          percent={Math.round((item.score / item.max_score) * 100)}
                          size={80}
                          strokeColor={color}
                          format={() => (
                            <div>
                              <div style={{ fontSize: 22, fontWeight: 700, color }}>{item.score}</div>
                              <div style={{ fontSize: 11, color: '#9ca3af' }}>/{item.max_score}</div>
                            </div>
                          )}
                        />
                        <div style={{ marginTop: 8 }}>
                          <Tag color={color} style={{ borderRadius: 6 }}>{getScoreLabel(item.score)}</Tag>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        textAlign: 'center', padding: '16px 0', marginBottom: 12,
                        background: '#f9fafb', borderRadius: 8,
                      }}>
                        <Tag style={{ borderRadius: 6, fontSize: 13 }}>未批改</Tag>
                      </div>
                    )}

                    {item.ai_score !== null && item.ai_score !== undefined && (
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 10px', background: '#f0f5ff', borderRadius: 6, marginBottom: 8, fontSize: 13,
                      }}>
                        <span style={{ color: '#4b5563' }}>AI评分</span>
                        <span style={{ fontWeight: 600, color: '#4f46e5' }}>{item.ai_score}</span>
                      </div>
                    )}

                    {item.teacher_comment && (
                      <Tooltip title={item.teacher_comment}>
                        <div style={{
                          fontSize: 12, color: '#6b7280', padding: '6px 10px',
                          background: '#f9fafb', borderRadius: 6,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          marginBottom: 6,
                        }}>
                          {item.teacher_comment}
                        </div>
                      </Tooltip>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af' }}>
                      {item.submitted_at && (
                        <span><ClockCircleOutlined style={{ marginRight: 4 }} />
                          {new Date(item.submitted_at).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                      {item.is_late !== null && item.submitted_at && (
                        <Tag color={item.is_late ? 'orange' : 'green'} style={{ fontSize: 11, borderRadius: 4 }}>
                          {item.is_late ? '逾期' : '正常'}
                        </Tag>
                      )}
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
