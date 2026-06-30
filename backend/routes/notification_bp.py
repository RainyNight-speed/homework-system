from flask import Blueprint, request, jsonify, g
from datetime import datetime, timedelta
from models import db, Notification, Assignment, Submission, CourseClass, User
from middleware.auth import login_required, teacher_required

notification_bp = Blueprint('notification', __name__)


@notification_bp.route('', methods=['GET'])
@login_required
def list_notifications():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)

    pagination = Notification.query.filter_by(user_id=g.user_id) \
        .order_by(Notification.created_at.desc()) \
        .paginate(page=page, per_page=per_page, error_out=False)

    items = [n.to_dict() for n in pagination.items]

    # 学生：动态计算截止时间提醒（不入库）
    if g.role == 'student':
        now = datetime.utcnow()
        deadline = now + timedelta(hours=24)
        user = User.query.get(g.user_id)
        if user and user.class_id:
            upcoming = Assignment.query \
                .join(CourseClass, Assignment.course_class_id == CourseClass.id) \
                .filter(CourseClass.class_id == user.class_id) \
                .filter(Assignment.due_date > now) \
                .filter(Assignment.due_date <= deadline) \
                .all()
            for a in upcoming:
                submitted = Submission.query.filter_by(
                    assignment_id=a.id, student_id=g.user_id
                ).first()
                if not submitted:
                    hours_left = int((a.due_date - now).total_seconds() / 3600)
                    items.insert(0, {
                        'id': f'deadline_{a.id}',
                        'user_id': g.user_id,
                        'type': 'reminder',
                        'title': '作业即将截止',
                        'message': f'《{a.title}》将在{hours_left}小时后截止，你尚未提交',
                        'is_read': False,
                        'related_id': a.id,
                        'created_at': a.due_date.isoformat(),
                        'is_computed': True
                    })

    return jsonify({
        'code': 200,
        'data': {
            'items': items,
            'total': pagination.total,
            'page': pagination.page,
            'per_page': pagination.per_page,
            'pages': pagination.pages
        },
        'message': 'success'
    })


@notification_bp.route('/unread-count', methods=['GET'])
@login_required
def unread_count():
    count = Notification.query.filter_by(user_id=g.user_id, is_read=False).count()

    # 学生：加上截止提醒数
    if g.role == 'student':
        now = datetime.utcnow()
        deadline = now + timedelta(hours=24)
        user = User.query.get(g.user_id)
        if user and user.class_id:
            upcoming = Assignment.query \
                .join(CourseClass, Assignment.course_class_id == CourseClass.id) \
                .filter(CourseClass.class_id == user.class_id) \
                .filter(Assignment.due_date > now) \
                .filter(Assignment.due_date <= deadline) \
                .all()
            for a in upcoming:
                submitted = Submission.query.filter_by(
                    assignment_id=a.id, student_id=g.user_id
                ).first()
                if not submitted:
                    count += 1

    return jsonify({'code': 200, 'data': {'unread_count': count}, 'message': 'success'})


@notification_bp.route('/<int:nid>/read', methods=['PUT'])
@login_required
def mark_read(nid):
    notif = Notification.query.get(nid)
    if not notif:
        return jsonify({'code': 404, 'data': None, 'message': '通知不存在'}), 404
    if notif.user_id != g.user_id:
        return jsonify({'code': 403, 'data': None, 'message': '无权操作'}), 403

    notif.is_read = True
    db.session.commit()
    return jsonify({'code': 200, 'data': None, 'message': '已标记为已读'})


@notification_bp.route('/read-all', methods=['PUT'])
@login_required
def mark_all_read():
    Notification.query.filter_by(user_id=g.user_id, is_read=False) \
        .update({'is_read': True})
    db.session.commit()
    return jsonify({'code': 200, 'data': None, 'message': '全部已读'})


@notification_bp.route('/announcement', methods=['POST'])
@teacher_required
def create_announcement():
    data = request.get_json()
    title = data.get('title', '').strip()
    message = data.get('message', '').strip()
    course_class_id = data.get('course_class_id')

    if not title or not message:
        return jsonify({'code': 400, 'data': None, 'message': '标题和内容必填'}), 400

    if not course_class_id:
        return jsonify({'code': 400, 'data': None, 'message': '请选择目标课程班级'}), 400

    cc = CourseClass.query.get(course_class_id)
    if not cc:
        return jsonify({'code': 404, 'data': None, 'message': '课程班级不存在'}), 404

    students = User.query.filter_by(class_id=cc.class_id, role='student').all()
    for s in students:
        notif = Notification(
            user_id=s.id,
            type='announcement',
            title=title,
            message=message,
            related_id=cc.course_id
        )
        db.session.add(notif)

    db.session.commit()
    return jsonify({'code': 200, 'data': None, 'message': f'公告已发送给{len(students)}名学生'})


def send_notification(user_id, type_, title, message, related_id=None):
    """工具函数：发送单条通知"""
    notif = Notification(
        user_id=user_id,
        type=type_,
        title=title,
        message=message,
        related_id=related_id
    )
    db.session.add(notif)


def send_notification_to_class(class_id, type_, title, message, related_id=None):
    """工具函数：发送通知给某班级所有学生"""
    students = User.query.filter_by(class_id=class_id, role='student').all()
    for s in students:
        send_notification(s.id, type_, title, message, related_id)
