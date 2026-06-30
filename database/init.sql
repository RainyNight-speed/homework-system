CREATE DATABASE IF NOT EXISTS homework_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE homework_system;

-- ==================== 表结构 ====================

-- 班级表
CREATE TABLE IF NOT EXISTS classes (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL UNIQUE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  username    VARCHAR(50) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('teacher', 'student') NOT NULL,
  name        VARCHAR(50) NOT NULL,
  class_name  VARCHAR(50),
  class_id    INT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- 课程表
CREATE TABLE IF NOT EXISTS courses (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  teacher_id  INT NOT NULL,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- 课程-班级关联表
CREATE TABLE IF NOT EXISTS course_classes (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  course_id   INT NOT NULL,
  class_id    INT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id)  REFERENCES classes(id)  ON DELETE CASCADE,
  UNIQUE KEY uq_course_class (course_id, class_id)
);

-- 作业表
CREATE TABLE IF NOT EXISTS assignments (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  teacher_id       INT NOT NULL,
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  due_date         DATETIME NOT NULL,
  max_score        INT DEFAULT 100,
  course_class_id  INT,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id)      REFERENCES users(id),
  FOREIGN KEY (course_class_id) REFERENCES course_classes(id)
);

-- 提交记录表
CREATE TABLE IF NOT EXISTS submissions (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  assignment_id   INT NOT NULL,
  student_id      INT NOT NULL,
  file_path       VARCHAR(500),
  content         TEXT,
  submitted_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_late         BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id),
  FOREIGN KEY (student_id)    REFERENCES users(id),
  UNIQUE KEY uq_assignment_student (assignment_id, student_id)
);

-- 批改记录表
CREATE TABLE IF NOT EXISTS grades (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  submission_id   INT NOT NULL UNIQUE,
  score           INT,
  teacher_comment TEXT,
  ai_comment      TEXT,
  ai_score        INT,
  graded_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES submissions(id)
);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT NOT NULL,
  type        ENUM('announcement', 'grade', 'reminder') NOT NULL,
  title       VARCHAR(200) NOT NULL,
  message     TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  related_id  INT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX ix_notification_user_read (user_id, is_read)
);

-- ==================== 测试数据 ====================

-- 班级
INSERT INTO classes (name) VALUES
('软件工程1班'),
('软件工程2班'),
('计算机科学1班');

-- 教师（密码均为 123456，bcrypt hash）
INSERT INTO users (username, password, role, name, class_id) VALUES
('teacher01', '123456', 'teacher', '张明老师', NULL),
('teacher02', '123456', 'teacher', '李华老师', NULL);

-- 学生
INSERT INTO users (username, password, role, name, class_id) VALUES
('student01', '123456', 'student', '王小明', 1),
('student02', '123456', 'student', '赵小红', 1),
('student03', '123456', 'student', '刘小刚', 1),
('student04', '123456', 'student', '陈小丽', 2),
('student05', '123456', 'student', '杨小伟', 2);

-- 课程
INSERT INTO courses (teacher_id, name, description) VALUES
(1, '人工智能导论', '本课程介绍人工智能的基本概念、发展历程和核心技术。'),
(1, '机器学习基础', '学习常见机器学习算法的原理与实践应用。'),
(2, '深度学习与计算机视觉', '深入学习卷积神经网络、目标检测等计算机视觉技术。');

-- 课程-班级关联
INSERT INTO course_classes (course_id, class_id) VALUES
(1, 1), (1, 2),   -- 人工智能导论 → 软件工程1班、2班
(2, 1),            -- 机器学习基础 → 软件工程1班
(3, 1), (3, 2);   -- 深度学习 → 软件工程1班、2班

-- 作业
INSERT INTO assignments (teacher_id, title, description, due_date, max_score, course_class_id) VALUES
(1, '人工智能概述论文', '请撰写一篇关于人工智能发展历程与未来趋势的论文，字数不少于2000字。', '2026-07-15 23:59:59', 100, 1),
(1, '机器学习算法实践', '选择一种机器学习算法（如决策树、SVM等），使用Python实现并分析其性能。', '2026-07-20 23:59:59', 100, 3),
(2, '深度学习图像识别', '使用卷积神经网络实现一个图像分类模型，提交代码和实验报告。', '2026-07-25 23:59:59', 100, 5);

-- 提交记录
INSERT INTO submissions (assignment_id, student_id, content, submitted_at, is_late) VALUES
(1, 3, '人工智能（Artificial Intelligence，AI）是计算机科学的一个重要分支。从1956年达特茅斯会议首次提出AI概念，到如今大语言模型的广泛应用，AI经历了多次发展浪潮...', '2026-07-14 10:00:00', FALSE),
(1, 4, '人工智能的发展可以追溯到20世纪50年代。本文将从AI的起源、发展历程、关键技术突破以及未来展望四个方面进行论述...', '2026-07-14 15:30:00', FALSE),
(1, 5, 'AI技术近年来取得了突破性进展，特别是在自然语言处理和计算机视觉领域...', '2026-07-16 08:00:00', TRUE),
(2, 3, '决策树算法实现代码及分析报告：使用sklearn库实现ID3决策树，在Iris数据集上准确率达到96%...', '2026-07-19 20:00:00', FALSE);

-- 批改记录
INSERT INTO grades (submission_id, score, teacher_comment, ai_score, ai_comment) VALUES
(1, 88, '论文结构完整，论述清晰，建议补充最新案例。', 85, '内容覆盖全面，逻辑清晰，但缺少2024年后的最新进展案例，建议补充大语言模型相关内容。'),
(2, 92, '论述深入，案例丰富，格式规范。', 90, '论文结构优秀，四个维度分析到位，案例选择恰当，表达规范。');

-- 通知（示例：给学生发送批改通知）
INSERT INTO notifications (user_id, type, title, message, is_read, related_id) VALUES
(3, 'grade', '作业批改完成', '你的作业《人工智能概述论文》已批改，得分：88/100', FALSE, 1),
(4, 'grade', '作业批改完成', '你的作业《人工智能概述论文》已批改，得分：92/100', TRUE, 1),
(3, 'reminder', '新作业发布', '教师张明老师发布了新作业《机器学习算法实践》，截止时间：2026-07-20 23:59', FALSE, 2);
