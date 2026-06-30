from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class Class(db.Model):
    __tablename__ = 'classes'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'student_count': len([u for u in self.users if u.role == 'student']),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('teacher', 'student'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    class_name = db.Column(db.String(50))
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    class_ = db.relationship('Class', backref='users')

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'name': self.name,
            'class_id': self.class_id,
            'class_name': self.class_.name if self.class_ else self.class_name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Course(db.Model):
    __tablename__ = 'courses'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    teacher = db.relationship('User', backref='courses')

    def to_dict(self):
        return {
            'id': self.id,
            'teacher_id': self.teacher_id,
            'teacher_name': self.teacher.name if self.teacher else None,
            'name': self.name,
            'description': self.description,
            'classes': [cc.to_dict() for cc in self.course_classes],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class CourseClass(db.Model):
    __tablename__ = 'course_classes'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    course = db.relationship('Course', backref='course_classes')
    class_ = db.relationship('Class', backref='course_classes')

    __table_args__ = (
        db.UniqueConstraint('course_id', 'class_id', name='uq_course_class'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'course_id': self.course_id,
            'class_id': self.class_id,
            'course_name': self.course.name if self.course else None,
            'class_name': self.class_.name if self.class_ else None,
            'teacher_name': self.course.teacher.name if self.course and self.course.teacher else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Assignment(db.Model):
    __tablename__ = 'assignments'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime, nullable=False)
    max_score = db.Column(db.Integer, default=100)
    course_class_id = db.Column(db.Integer, db.ForeignKey('course_classes.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    teacher = db.relationship('User', backref='assignments')
    course_class = db.relationship('CourseClass', backref='assignments')

    def to_dict(self):
        return {
            'id': self.id,
            'teacher_id': self.teacher_id,
            'title': self.title,
            'description': self.description,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'max_score': self.max_score,
            'course_class_id': self.course_class_id,
            'course_name': self.course_class.course.name if self.course_class and self.course_class.course else None,
            'class_name': self.course_class.class_.name if self.course_class and self.course_class.class_ else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Submission(db.Model):
    __tablename__ = 'submissions'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey('assignments.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    file_path = db.Column(db.String(500))
    content = db.Column(db.Text)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_late = db.Column(db.Boolean, default=False)

    assignment = db.relationship('Assignment', backref='submissions')
    student = db.relationship('User', backref='submissions')

    __table_args__ = (
        db.UniqueConstraint('assignment_id', 'student_id', name='uq_assignment_student'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'assignment_id': self.assignment_id,
            'student_id': self.student_id,
            'student_name': self.student.name if self.student else None,
            'file_path': self.file_path,
            'content': self.content,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'is_late': self.is_late
        }


class Grade(db.Model):
    __tablename__ = 'grades'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('submissions.id'), unique=True, nullable=False)
    score = db.Column(db.Integer)
    teacher_comment = db.Column(db.Text)
    ai_comment = db.Column(db.Text)
    ai_score = db.Column(db.Integer)
    graded_at = db.Column(db.DateTime, default=datetime.utcnow)

    submission = db.relationship('Submission', backref='grade', uselist=False)

    def to_dict(self):
        return {
            'id': self.id,
            'submission_id': self.submission_id,
            'score': self.score,
            'teacher_comment': self.teacher_comment,
            'ai_comment': self.ai_comment,
            'ai_score': self.ai_score,
            'graded_at': self.graded_at.isoformat() if self.graded_at else None
        }


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.Enum('announcement', 'grade', 'reminder'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False)
    related_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='notifications')

    __table_args__ = (
        db.Index('ix_notification_user_read', 'user_id', 'is_read'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'is_read': self.is_read,
            'related_id': self.related_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
