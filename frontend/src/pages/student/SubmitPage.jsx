import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Upload, Button, Spin, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import api from '../../api';

export default function SubmitPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fileList, setFileList] = useState([]);
  const [existing, setExisting] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    // 检查是否已有提交（编辑模式）
    api.get('/submissions?per_page=100').then(res => {
      const sub = res.data.items.find(s => s.assignment_id === parseInt(id));
      if (sub) {
        setExisting(sub);
        form.setFieldsValue({ content: sub.content });
        if (sub.file_path) {
          setFileList([{ uid: '-1', name: sub.file_path, status: 'done', url: `/api/submissions/files/${sub.file_path}` }]);
        }
      }
    }).catch(() => {}).finally(() => setInitialLoading(false));
  }, [id, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('assignment_id', id);
      if (values.content) formData.append('content', values.content);
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('file', fileList[0].originFileObj);
      }

      if (existing) {
        await api.put(`/submissions/${existing.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        message.success('修改成功');
      } else {
        await api.post('/submissions', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        message.success('提交成功');
      }
      navigate('/student/assignments');
    } catch (err) {
      message.error(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <Card title={existing ? '修改作业' : '提交作业'} extra={
      <Button onClick={() => navigate('/student/assignments')}>返回</Button>
    }>
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 600 }}>
        <Form.Item name="content" label="作业内容">
          <Input.TextArea rows={8} placeholder="请输入作业内容（文本提交）" />
        </Form.Item>
        <Form.Item label="附件上传">
          <Upload
            beforeUpload={(file) => {
              setFileList([{ ...file, originFileObj: file }]);
              return false;
            }}
            fileList={fileList}
            onRemove={() => setFileList([])}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
          <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
            支持上传单个文件，最大10MB
            {existing?.file_path && <span style={{ marginLeft: 8, color: '#4f46e5' }}>当前已有附件：{existing.file_path}</span>}
          </div>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {existing ? '保存修改' : '提交作业'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
