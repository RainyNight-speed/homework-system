import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Select, Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import api from '../../api';

export default function Statistics() {
  const [assignments, setAssignments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [stats, setStats] = useState(null);
  const [classStats, setClassStats] = useState(null);

  useEffect(() => {
    api.get('/assignments?per_page=100').then(res => {
      setAssignments(res.data.items);
      if (res.data.items.length > 0) setSelectedId(res.data.items[0].id);
    });
    api.get('/statistics/class').then(res => setClassStats(res.data));
  }, []);

  useEffect(() => {
    if (selectedId) {
      api.get(`/statistics/assignment/${selectedId}`).then(res => setStats(res.data));
    }
  }, [selectedId]);

  const getPieOption = () => {
    if (!stats) return {};
    return {
      title: { text: '成绩分布', left: 'center' },
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie', radius: '60%',
        data: [
          { value: stats.excellent, name: '优秀(≥90)', itemStyle: { color: '#52c41a' } },
          { value: stats.pass, name: '及格(60-89)', itemStyle: { color: '#1890ff' } },
          { value: stats.fail, name: '不及格(<60)', itemStyle: { color: '#ff4d4f' } },
        ]
      }]
    };
  };

  const getSubmitPieOption = () => {
    if (!stats) return {};
    return {
      title: { text: '提交情况', left: 'center' },
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie', radius: '60%',
        data: [
          { value: stats.submitted_count, name: '已提交', itemStyle: { color: '#1890ff' } },
          { value: stats.not_submitted, name: '未提交', itemStyle: { color: '#d9d9d9' } },
        ]
      }]
    };
  };

  const getBarOption = () => {
    if (!classStats?.assignments?.length) return {};
    const items = classStats.assignments;
    return {
      title: { text: '各作业平均分对比', left: 'center' },
      tooltip: {},
      xAxis: { type: 'category', data: items.map(a => a.title), axisLabel: { rotate: 15 } },
      yAxis: { type: 'value', max: 100 },
      series: [{ type: 'bar', data: items.map(a => a.avg_score || 0), itemStyle: { color: '#1890ff' } }]
    };
  };

  const handleExport = () => {
    if (!selectedId) return;
    window.open(`/api/statistics/assignment/${selectedId}/export`, '_blank');
  };

  return (
    <div>
      <Card title="成绩统计" extra={
        <div style={{ display: 'flex', gap: 8 }}>
          <Select value={selectedId} onChange={setSelectedId} style={{ width: 250 }}
            options={assignments.map(a => ({ value: a.id, label: a.title }))} />
          <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={!selectedId}>
            导出CSV
          </Button>
        </div>
      }>
        {stats && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={4}><Statistic title="总学生数" value={stats.total_students} /></Col>
            <Col span={4}><Statistic title="已提交" value={stats.submitted_count} valueStyle={{ color: '#1890ff' }} /></Col>
            <Col span={4}><Statistic title="未提交" value={stats.not_submitted} valueStyle={{ color: '#ff4d4f' }} /></Col>
            <Col span={4}><Statistic title="平均分" value={stats.avg_score || '-'} /></Col>
            <Col span={4}><Statistic title="最高分" value={stats.max_score || '-'} valueStyle={{ color: '#52c41a' }} /></Col>
            <Col span={4}><Statistic title="最低分" value={stats.min_score || '-'} valueStyle={{ color: '#ff4d4f' }} /></Col>
          </Row>
        )}
        <Row gutter={16}>
          <Col span={8}>{stats && <ReactECharts option={getPieOption()} style={{ height: 300 }} />}</Col>
          <Col span={8}>{stats && <ReactECharts option={getSubmitPieOption()} style={{ height: 300 }} />}</Col>
          <Col span={8}>{classStats && <ReactECharts option={getBarOption()} style={{ height: 300 }} />}</Col>
        </Row>
      </Card>
    </div>
  );
}
