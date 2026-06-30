import React, { useState } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import api from '../api';

export default function ChangePassword() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    if (values.new_password !== values.confirm_password) {
      message.error('两次输入的新密码不一致');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        old_password: values.old_password,
        new_password: values.new_password
      });
      message.success('密码修改成功');
    } catch (err) {
      message.error(err.message || '修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="修改密码">
      <Form layout="vertical" onFinish={onFinish} style={{ maxWidth: 400 }}>
        <Form.Item name="old_password" label="旧密码" rules={[{ required: true, message: '请输入旧密码' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="请输入旧密码" />
        </Form.Item>
        <Form.Item name="new_password" label="新密码" rules={[
          { required: true, message: '请输入新密码' },
          { min: 6, message: '密码长度至少6位' }
        ]}>
          <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" />
        </Form.Item>
        <Form.Item name="confirm_password" label="确认新密码" rules={[{ required: true, message: '请确认新密码' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>确认修改</Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
