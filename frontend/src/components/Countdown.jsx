import React, { useState, useEffect } from 'react';
import { Tag } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

export default function Countdown({ dueDate }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const due = new Date(dueDate);
      const diff = due - now;

      if (diff <= 0) {
        setTimeLeft('已截止');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}天${hours}小时`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}小时${minutes}分钟`);
      } else {
        setTimeLeft(`${minutes}分钟`);
      }
    };

    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [dueDate]);

  const isExpired = new Date(dueDate) <= new Date();

  return (
    <Tag icon={<ClockCircleOutlined />} color={isExpired ? 'red' : 'blue'}>
      {timeLeft}
    </Tag>
  );
}
