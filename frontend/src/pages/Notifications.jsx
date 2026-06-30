import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Button, Space, message } from 'antd';
import { BellOutlined, TrophyOutlined, ClockCircleOutlined, SoundOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const typeConfig = {
  announcement: { icon: <SoundOutlined />, color: 'blue', label: '公告' },
  grade: { icon: <TrophyOutlined />, color: 'green', label: '成绩' },
  reminder: { icon: <ClockCircleOutlined />, color: 'orange', label: '提醒' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchNotifications = () => {
    setLoading(true);
    api.get('/notifications?per_page=50')
      .then(res => setNotifications(res.data.items))
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    if (String(id).startsWith('deadline_')) return;
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      message.success('全部已读');
    } catch {
      message.error('操作失败');
    }
  };

  const handleClick = (item) => {
    markRead(item.id);
    if (item.type === 'grade' || item.type === 'reminder') {
      if (user.role === 'student') {
        navigate('/student/assignments');
      } else {
        navigate('/teacher/assignments');
      }
    }
  };

  return (
    <Card title="消息通知" extra={
      <Space>
        <Button icon={<CheckOutlined />} onClick={markAllRead}>全部已读</Button>
      </Space>
    }>
      <List
        loading={loading}
        dataSource={notifications}
        locale={{ emptyText: '暂无通知' }}
        renderItem={(item) => {
          const cfg = typeConfig[item.type] || typeConfig.reminder;
          return (
            <List.Item
              style={{
                cursor: 'pointer',
                background: item.is_read ? 'transparent' : '#f0f5ff',
                padding: '12px 16px',
                borderRadius: 8,
                marginBottom: 4,
                transition: 'background 0.2s',
              }}
              onClick={() => handleClick(item)}
              actions={[
                !item.is_read && !item.is_computed && (
                  <Button size="small" type="link" onClick={(e) => { e.stopPropagation(); markRead(item.id); }}>
                    标为已读
                  </Button>
                )
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={<Tag icon={cfg.icon} color={cfg.color}>{cfg.label}</Tag>}
                title={
                  <Space>
                    <span style={{ fontWeight: item.is_read ? 400 : 600 }}>{item.title}</span>
                    {!item.is_read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f46e5', display: 'inline-block' }} />}
                  </Space>
                }
                description={item.message}
              />
              <span style={{ color: '#999', fontSize: 12, whiteSpace: 'nowrap' }}>
                {new Date(item.created_at).toLocaleString('zh-CN')}
              </span>
            </List.Item>
          );
        }}
      />
    </Card>
  );
}
