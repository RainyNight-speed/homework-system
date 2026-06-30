import React, { useState, useEffect } from 'react';
import { Badge } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const prefix = user.role === 'teacher' ? '/teacher' : '/student';

  const fetchCount = () => {
    api.get('/notifications/unread-count')
      .then(res => setCount(res.data.unread_count || 0))
      .catch(() => {});
  };

  useEffect(() => {
    fetchCount();
    const timer = setInterval(fetchCount, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Badge count={count} size="small" offset={[-2, 2]}>
      <BellOutlined
        style={{ fontSize: 20, cursor: 'pointer', padding: '4px 8px' }}
        onClick={() => navigate(`${prefix}/notifications`)}
      />
    </Badge>
  );
}
