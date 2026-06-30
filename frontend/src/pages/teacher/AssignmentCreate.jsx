import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, InputNumber, DatePicker, Button, Select, message, Spin } from 'antd';
import dayjs from 'dayjs';
import api from '../../api';

export default function AssignmentCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [courseClasses, setCourseClasses] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    api.get('/courses').then(res => {
      const ccs = [];
      res.data.items.forEach(c => {
        c.classes?.forEach(cls => {
          ccs.push({ value: cls.id, label: `${c.name} - ${cls.class_name}` });
        });
      });
      setCourseClasses(ccs);
    }).catch(() => {});

    if (isEdit) {
      api.get(`/assignments?page=1&per_page=100`).then(res => {
        const a = res.data.items.find(item => item.id === parseInt(id));
        if (a) {
          form.setFieldsValue({
            title: a.title,
            description: a.description,
            due_date: dayjs(a.due_date),
            max_score: a.max_score,
            course_class_id: a.course_class_id,
          });
        }
      }).catch(() => message.error('加载作业信息失败'))
        .finally(() => setInitialLoading(false));
    }
  }, [id, isEdit, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        title: values.title,
        description: values.description,
        due_date: values.due_date.toISOString(),
        max_score: values.max_score,
        course_class_id: values.course_class_id,
      };
      if (isEdit) {
        await api.put(`/assignments/${id}`, payload);
        message.success('修改成功');
      } else {
        await api.post('/assignments', payload);
        message.success('作业发布成功');
      }
      navigate('/teacher/assignments');
    } catch (err) {
      message.error(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <Card title={isEdit ? '编辑作业' : '发布作业'}>
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 600 }}
        initialValues={isEdit ? undefined : { max_score: 100 }}>
        <Form.Item name="course_class_id" label="所属课程班级"
          rules={[{ required: true, message: '请选择课程班级' }]}>
          <Select placeholder="选择课程和班级" options={courseClasses} showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            } />
        </Form.Item>
        <Form.Item name="title" label="作业标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="请输入作业标题" />
        </Form.Item>
        <Form.Item name="description" label="作业描述">
          <Input.TextArea rows={4} placeholder="请输入作业要求和描述" />
        </Form.Item>
        <Form.Item name="due_date" label="截止时间" rules={[{ required: true, message: '请选择截止时间' }]}>
          <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="max_score" label="满分分值">
          <InputNumber min={1} max={1000} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEdit ? '保存修改' : '发布作业'}
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate('/teacher/assignments')}>取消</Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
