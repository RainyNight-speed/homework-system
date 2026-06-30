import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Modal, Form, Input, Upload, message, Row, Col, Empty, Spin } from 'antd';
import { PlusOutlined, UploadOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../api';

const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

export default function ClassManagement() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importTargetId, setImportTargetId] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [form] = Form.useForm();

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch {
      message.error('获取班级列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClasses(); }, []);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingClass) {
        await api.put(`/classes/${editingClass.id}`, values);
        message.success('修改成功');
      } else {
        await api.post('/classes', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingClass(null);
      fetchClasses();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const handleImport = async (info) => {
    if (info.file.status === 'done') {
      const res = info.file.response;
      if (res.code === 200) {
        message.success(res.message);
        setImportModalVisible(false);
        fetchClasses();
      } else {
        message.error(res.message);
      }
    } else if (info.file.status === 'error') {
      message.error('上传失败');
    }
  };

  const handleEdit = (e, record) => {
    e.stopPropagation();
    setEditingClass(record);
    form.setFieldsValue({ name: record.name });
    setModalVisible(true);
  };

  const handleImportClick = (e, classId) => {
    e.stopPropagation();
    setImportTargetId(classId);
    setImportModalVisible(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>班级管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingClass(null);
          form.resetFields();
          setModalVisible(true);
        }}>新增班级</Button>
      </div>

      <Spin spinning={loading}>
        {classes.length === 0 && !loading ? (
          <Card><Empty description="暂无班级，点击上方按钮创建" /></Card>
        ) : (
          <Row gutter={[20, 20]}>
            {classes.map((cls, idx) => (
              <Col key={cls.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                  style={{
                    borderRadius: 16, overflow: 'hidden', border: 'none',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  }}
                  styles={{ body: { padding: 0 } }}
                >
                  <div style={{
                    background: gradients[idx % gradients.length],
                    padding: '24px 20px 16px', color: '#fff',
                  }}>
                    <TeamOutlined style={{ fontSize: 32, marginBottom: 8, display: 'block', opacity: 0.9 }} />
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{cls.name}</div>
                  </div>
                  <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: 13 }}>
                      <UserOutlined style={{ marginRight: 4 }} />
                      {cls.student_count || 0} 名学生
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button size="small" type="link" onClick={(e) => handleEdit(e, cls)}>编辑</Button>
                      <Button size="small" type="link" onClick={(e) => handleImportClick(e, cls.id)}>
                        <UploadOutlined /> 导入
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>

      <Modal title={editingClass ? '编辑班级' : '新增班级'} open={modalVisible}
        onOk={handleOk} onCancel={() => { setModalVisible(false); setEditingClass(null); }}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="班级名称" rules={[{ required: true, message: '请输入班级名称' }]}>
            <Input placeholder="如：软件工程1班" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="导入学生名单" open={importModalVisible}
        footer={null} onCancel={() => setImportModalVisible(false)}>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>
          上传 CSV 文件，格式：<code>username,name,password</code>（password 可省略，默认 123456）
        </p>
        <Upload
          accept=".csv"
          action={`/api/classes/${importTargetId}/import`}
          headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
          onChange={handleImport}
          maxCount={1}
        >
          <Button icon={<UploadOutlined />} type="primary">选择 CSV 文件</Button>
        </Upload>
      </Modal>
    </div>
  );
}
