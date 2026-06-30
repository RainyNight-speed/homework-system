import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Tag, Upload, Modal, message, Space, Collapse } from 'antd';
import { ArrowLeftOutlined, UploadOutlined, TeamOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [importClassId, setImportClassId] = useState(null);

  const fetchCourse = () => {
    setLoading(true);
    api.get(`/courses/${id}`)
      .then(res => setCourse(res.data))
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCourse(); }, [id]);

  const handleDelete = async () => {
    try {
      await api.delete(`/courses/${id}`);
      message.success('删除成功');
      navigate('/teacher/courses');
    } catch (err) {
      message.error(err.message || '删除失败');
    }
  };

  const handleImport = (info) => {
    if (info.file.status === 'done') {
      const res = info.file.response;
      if (res.code === 200) {
        message.success(res.message);
        setImportVisible(false);
        fetchCourse();
      } else {
        message.error(res.message);
      }
    }
  };

  const openImport = (classId) => {
    setImportClassId(classId);
    setImportVisible(true);
  };

  const studentColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name', render: (t) => <span style={{ fontWeight: 500 }}>{t}</span> },
    { title: '用户名', dataIndex: 'username', key: 'username' },
  ];

  if (!course) return null;

  const totalStudents = course.classes?.reduce((sum, c) => sum + (c.students?.length || 0), 0) || 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/teacher/courses')}>返回</Button>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{course.name}</h2>
          <Tag color="blue">{totalStudents} 名学生</Tag>
        </Space>
        <Space>
          <Button icon={<EditOutlined />} onClick={() => navigate(`/teacher/courses/${id}/edit`)}>编辑课程</Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>删除课程</Button>
        </Space>
      </div>

      {course.description && (
        <Card style={{ marginBottom: 16, borderRadius: 12 }}>
          <div style={{ color: '#4b5563' }}>{course.description}</div>
        </Card>
      )}

      <Collapse
        defaultActiveKey={course.classes?.map(c => String(c.class_id))}
        items={course.classes?.map(cc => ({
          key: String(cc.class_id),
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: 16 }}>
              <span><TeamOutlined style={{ marginRight: 8 }} />{cc.class_name}</span>
              <Space>
                <Tag>{cc.students?.length || 0} 人</Tag>
                <Button size="small" type="link" icon={<UploadOutlined />}
                  onClick={(e) => { e.stopPropagation(); openImport(cc.class_id); }}>
                  导入学生
                </Button>
              </Space>
            </div>
          ),
          children: (
            <Table
              dataSource={cc.students || []}
              columns={studentColumns}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: '暂无学生' }}
            />
          ),
        }))}
        style={{ borderRadius: 12, overflow: 'hidden' }}
      />

      <Modal title="导入学生名单" open={importVisible} footer={null}
        onCancel={() => setImportVisible(false)}>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>
          上传 CSV 文件，格式：<code>username,name,password</code>（password 可省略，默认 123456）
        </p>
        <Upload accept=".csv" action={`/api/classes/${importClassId}/import`}
          headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
          onChange={handleImport} maxCount={1}>
          <Button icon={<UploadOutlined />} type="primary">选择 CSV 文件</Button>
        </Upload>
      </Modal>
    </div>
  );
}
