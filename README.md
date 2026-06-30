# 作业管理系统

## 环境要求

- Python 3.10+
- Node.js 18+
- MySQL 8.0+

## 快速开始

### 1. 初始化数据库

```bash
mysql -u root -p < database/init.sql
```

### 2. 后端

```bash
cd backend
cp .env.example .env        # 编辑 .env 填入你的配置
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python app.py
```

后端运行在 http://localhost:5000

### 3. 前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 http://localhost:3000，自动代理 `/api` 请求到后端。

### 4. 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 教师 | teacher01 | 123456 |
| 学生 | student01 | 123456 |
