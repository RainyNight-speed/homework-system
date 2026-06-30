import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Select, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, BookOutlined } from '@ant-design/icons';
import api from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    api.get('/classes').then(res => setClasses(res.data)).catch(() => {});
  }, []);

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', values);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      message.success('登录成功');
      const path = res.data.user.role === 'teacher' ? '/teacher/assignments' : '/student/assignments';
      navigate(path);
    } catch (err) {
      message.error(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', values);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      message.success('注册成功');
      const path = res.data.user.role === 'teacher' ? '/teacher/assignments' : '/student/assignments';
      navigate(path);
    } catch (err) {
      message.error(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const loginForm = (
    <Form onFinish={handleLogin} size="large">
      <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
        <Input prefix={<UserOutlined />} placeholder="用户名" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>登录</Button>
      </Form.Item>
    </Form>
  );

  const registerForm = (
    <Form onFinish={handleRegister} size="large">
      <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
        <Input prefix={<UserOutlined />} placeholder="用户名" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
      </Form.Item>
      <Form.Item name="name" rules={[{ required: true, message: '请输入姓名' }]}>
        <Input placeholder="真实姓名" />
      </Form.Item>
      <Form.Item name="role" rules={[{ required: true, message: '请选择角色' }]}>
        <Select placeholder="选择角色">
          <Select.Option value="teacher">教师</Select.Option>
          <Select.Option value="student">学生</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="class_id" noStyle dependencies={['role']}>
        {({ getFieldValue }) => getFieldValue('role') === 'student' ? (
          <Form.Item name="class_id" label="所在班级">
            <Select placeholder="选择班级" allowClear
              options={classes.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
        ) : null}
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>注册</Button>
      </Form.Item>
    </Form>
  );

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #6366f1 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'rgba(99, 102, 241, 0.15)', top: -100, right: -100,
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'rgba(129, 140, 248, 0.1)', bottom: -80, left: -80,
      }} />

      <Card style={{
        width: 420, borderRadius: 16,
        backdropFilter: 'blur(20px)',
        background: 'rgba(255, 255, 255, 0.95)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: 'none',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <BookOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <h2 style={{ margin: 0, color: '#1e1b4b', fontWeight: 700, fontSize: 22, letterSpacing: 1 }}>
            班级作业管理系统
          </h2>
          <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 13 }}>
            Homework Management System
          </p>
        </div>
        <Tabs centered items={[
          { key: 'login', label: '登录', children: loginForm },
          { key: 'register', label: '注册', children: registerForm },
        ]} />
      </Card>
    </div>
  );
}
