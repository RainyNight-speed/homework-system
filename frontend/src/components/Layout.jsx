import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Dropdown, Space } from 'antd';
import {
  FileTextOutlined,
  PlusCircleOutlined,
  BarChartOutlined,
  UnorderedListOutlined,
  HistoryOutlined,
  LogoutOutlined,
  KeyOutlined,
  TrophyOutlined,
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import NotificationBell from './NotificationBell';

const { Sider, Content, Header } = AntLayout;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isTeacher = user.role === 'teacher';

  const teacherMenu = [
    { key: '/teacher/assignments', icon: <UnorderedListOutlined />, label: '作业列表' },
    { key: '/teacher/assignments/new', icon: <PlusCircleOutlined />, label: '发布作业' },
    { key: '/teacher/courses', icon: <ReadOutlined />, label: '课程管理' },
    { key: '/teacher/classes', icon: <TeamOutlined />, label: '班级管理' },
    { key: '/teacher/statistics', icon: <BarChartOutlined />, label: '成绩统计' },
  ];

  const studentMenu = [
    { key: '/student/assignments', icon: <FileTextOutlined />, label: '作业列表' },
    { key: '/student/courses', icon: <BookOutlined />, label: '我的课程' },
    { key: '/student/history', icon: <HistoryOutlined />, label: '提交记录' },
    { key: '/student/grades', icon: <TrophyOutlined />, label: '我的成绩' },
  ];

  const menuItems = isTeacher ? teacherMenu : studentMenu;

  const userMenuItems = [
    {
      key: 'change-password',
      icon: <KeyOutlined />,
      label: '修改密码',
      onClick: () => navigate(`/${isTeacher ? 'teacher' : 'student'}/change-password`)
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        style={{
          background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{
          padding: '24px 20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          marginBottom: 8,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#fff',
          }}>
            <BookOutlined />
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>
            作业管理系统
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.85)',
          }}
          theme="dark"
        />
      </Sider>
      <AntLayout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          zIndex: 10,
        }}>
          <span style={{ fontSize: 15, color: '#374151' }}>
            {isTeacher ? '教师工作台' : '学生中心'}
          </span>
          <Space size={16}>
            <NotificationBell />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer', color: '#4b5563' }}>
                <UserOutlined />
                <span>{user.name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#f3f4f6', minHeight: 'auto' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
