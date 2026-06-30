import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, Select, Button, message } from 'antd';
import api from '../../api';

export default function CourseCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    api.get('/classes').then(res => setClasses(res.data));
    if (isEdit) {
      api.get(`/courses/${id}`).then(res => {
        const course = res.data;
        const form = document.querySelector('form');
        if (form) {
          form.querySelector('[name="name"]').value = course.name;
        }
      });
    }
  }, [id, isEdit]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/courses/${id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/courses', values);
        message.success('创建成功');
      }
      navigate('/teacher/courses');
    } catch (err) {
      message.error(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={isEdit ? '编辑课程' : '新建课程'} extra={
      <Button onClick={() => navigate('/teacher/courses')}>返回</Button>
    }>
      <Form layout="vertical" onFinish={onFinish} style={{ maxWidth: 600 }}
        initialValues={isEdit ? undefined : { class_ids: [] }}>
        <Form.Item name="name" label="课程名称" rules={[{ required: true, message: '请输入课程名称' }]}>
          <Input placeholder="如：数据结构" />
        </Form.Item>
        <Form.Item name="description" label="课程描述">
          <Input.TextArea rows={3} placeholder="课程简介（选填）" />
        </Form.Item>
        <Form.Item name="class_ids" label="关联班级" rules={[{ required: true, message: '请选择至少一个班级' }]}>
          <Select mode="multiple" placeholder="选择班级"
            options={classes.map(c => ({ value: c.id, label: c.name }))} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEdit ? '保存修改' : '创建课程'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
