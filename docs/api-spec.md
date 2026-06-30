# 班级作业提交与统计管理系统 — API 文档

## 基础信息
- 基础路径：`/api`
- 认证方式：JWT Bearer Token（Header: `Authorization: Bearer <token>`）
- 统一响应格式：`{"code": 200, "data": {...}, "message": "success"}`

---

## 1. 认证模块 `/api/auth`

### POST `/api/auth/register` — 注册

**请求体：**
```json
{
  "username": "student01",
  "password": "123456",
  "name": "王小明",
  "role": "student",
  "class_name": "软件工程1班"
}
```

**响应：**
```json
{
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 3,
      "username": "student01",
      "role": "student",
      "name": "王小明",
      "class_name": "软件工程1班",
      "created_at": "2026-06-30T10:00:00"
    }
  },
  "message": "注册成功"
}
```

### POST `/api/auth/login` — 登录

**请求体：**
```json
{
  "username": "teacher01",
  "password": "123456"
}
```

**响应：** 同注册响应结构。

### GET `/api/auth/users/me` — 获取当前用户信息

**Headers:** `Authorization: Bearer <token>`

---

## 2. 作业管理 `/api/assignments`

### POST `/api/assignments` — 发布作业（教师权限）

**请求体：**
```json
{
  "title": "人工智能概述论文",
  "description": "请撰写一篇关于人工智能发展历程的论文",
  "due_date": "2026-07-15T23:59:59",
  "max_score": 100
}
```

### GET `/api/assignments` — 获取作业列表（所有用户）

### GET `/api/assignments/:id` — 作业详情

### PUT `/api/assignments/:id` — 编辑作业（教师，仅自己发布的）

### DELETE `/api/assignments/:id` — 删除作业（教师，仅自己发布的）

---

## 3. 作业提交 `/api/submissions`

### POST `/api/submissions` — 提交作业（学生权限）

**请求体（支持 multipart/form-data）：**
```
assignment_id: 1
content: 作业文本内容
file: (可选，附件)
```

### PUT `/api/submissions/:id` — 修改提交（截止时间前）

### GET `/api/submissions?assignment_id=X` — 查看提交列表

### GET `/api/submissions/:id/status` — 查看提交状态

**响应：**
```json
{
  "code": 200,
  "data": {
    "is_late": false,
    "can_edit": true,
    "submitted_at": "2026-07-14T10:00:00",
    "due_date": "2026-07-15T23:59:59"
  }
}
```

---

## 4. 批改模块 `/api/grades`

### POST `/api/grades/:submission_id` — 教师手动批改

**请求体：**
```json
{
  "score": 88,
  "comment": "论文结构完整，论述清晰。"
}
```

### POST `/api/grades/:submission_id/ai` — AI自动批改

**响应：**
```json
{
  "code": 200,
  "data": {
    "submission_id": 1,
    "score": 88,
    "teacher_comment": "论文结构完整",
    "ai_score": 85,
    "ai_comment": "内容覆盖全面，逻辑清晰，但缺少最新案例。",
    "graded_at": "2026-07-14T12:00:00"
  }
}
```

---

## 5. 成绩统计 `/api/statistics`

### GET `/api/statistics/assignment/:id` — 单次作业统计（教师权限）

**响应：**
```json
{
  "code": 200,
  "data": {
    "total_students": 5,
    "submitted_count": 3,
    "not_submitted": 2,
    "graded_count": 2,
    "avg_score": 90.0,
    "max_score": 92,
    "min_score": 88,
    "excellent": 1,
    "pass": 1,
    "fail": 0
  }
}
```

### GET `/api/statistics/class` — 班级整体统计（教师权限）

### GET `/api/statistics/student/:id` — 学生个人成绩（登录用户）

---

## 错误码说明

| code | 含义 |
|------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证/令牌无效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## AI 批改 Prompt 设计

```
你是一位大学教师，正在批改学生作业。

作业题目：{assignment_title}
学生提交内容：{student_content}

请从以下维度评分（满分100分），并给出评语：
1. 内容完整性（30分）
2. 逻辑清晰度（30分）
3. 创新性（20分）
4. 表达规范性（20分）

请仅返回JSON格式：
{"score": 分数, "comment": "详细评语"}
```

**Prompt 优化迭代过程：**
- V1：仅要求打分 → AI输出格式不稳定
- V2：加入评分维度 → 输出更结构化
- V3：限定JSON格式 + "仅返回JSON" → 解析成功率提升至95%+
