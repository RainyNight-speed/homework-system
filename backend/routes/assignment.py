from flask import Blueprint, request, jsonify, g
from datetime import datetime
from models import db, Assignment, CourseClass, User
from middleware.auth import login_required, teacher_required
from routes.notification_bp import send_notification_to_class

assignment_bp = Blueprint('assignment', __name__)


@assignment_bp.route('', methods=['POST'])
@teacher_required
def create_assignment():
    data = request.get_json()
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    due_date = data.get('due_date', '')
    max_score = data.get('max_score', 100)
    course_class_id = data.get('course_class_id')

    if not title or not due_date:
        return jsonify({'code': 400, 'data': None, 'message': '标题和截止时间必填'}), 400

    try:
        due = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'code': 400, 'data': None, 'message': '日期格式错误，请使用ISO格式'}), 400

    assignment = Assignment(
        teacher_id=g.user_id,
        title=title,
        description=description,
        due_date=due,
        max_score=max_score,
        course_class_id=course_class_id
    )
    db.session.add(assignment)
    db.session.commit()

    # 发送通知给目标班级学生
    if course_class_id:
        cc = CourseClass.query.get(course_class_id)
        if cc:
            teacher = User.query.get(g.user_id)
            due_str = due.strftime('%Y-%m-%d %H:%M')
            send_notification_to_class(
                cc.class_id, 'reminder',
                '新作业发布',
                f'教师{teacher.name}发布了新作业《{title}》，截止时间：{due_str}',
                assignment.id
            )
            db.session.commit()

    return jsonify({'code': 200, 'data': assignment.to_dict(), 'message': '作业发布成功'})


@assignment_bp.route('', methods=['GET'])
@login_required
def list_assignments():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)

    query = Assignment.query
    if g.role == 'teacher':
        query = query.filter_by(teacher_id=g.user_id)
    elif g.role == 'student':
        user = User.query.get(g.user_id)
        if user and user.class_id:
            query = query.join(CourseClass, Assignment.course_class_id == CourseClass.id, isouter=True) \
                .filter(
                    (CourseClass.class_id == user.class_id) |
                    (Assignment.course_class_id.is_(None))
                )

    pagination = query.order_by(Assignment.created_at.desc()) \
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'code': 200,
        'data': {
            'items': [a.to_dict() for a in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'per_page': pagination.per_page,
            'pages': pagination.pages
        },
        'message': 'success'
    })


@assignment_bp.route('/<int:aid>', methods=['GET'])
@login_required
def get_assignment(aid):
    assignment = Assignment.query.get(aid)
    if not assignment:
        return jsonify({'code': 404, 'data': None, 'message': '作业不存在'}), 404
    return jsonify({'code': 200, 'data': assignment.to_dict(), 'message': 'success'})


@assignment_bp.route('/<int:aid>', methods=['PUT'])
@teacher_required
def update_assignment(aid):
    assignment = Assignment.query.get(aid)
    if not assignment:
        return jsonify({'code': 404, 'data': None, 'message': '作业不存在'}), 404
    if assignment.teacher_id != g.user_id:
        return jsonify({'code': 403, 'data': None, 'message': '只能编辑自己发布的作业'}), 403

    data = request.get_json()
    if 'title' in data:
        assignment.title = data['title'].strip()
    if 'description' in data:
        assignment.description = data['description'].strip()
    if 'due_date' in data:
        try:
            assignment.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'code': 400, 'data': None, 'message': '日期格式错误'}), 400
    if 'max_score' in data:
        assignment.max_score = data['max_score']

    db.session.commit()
    return jsonify({'code': 200, 'data': assignment.to_dict(), 'message': '更新成功'})


@assignment_bp.route('/<int:aid>', methods=['DELETE'])
@teacher_required
def delete_assignment(aid):
    assignment = Assignment.query.get(aid)
    if not assignment:
        return jsonify({'code': 404, 'data': None, 'message': '作业不存在'}), 404
    if assignment.teacher_id != g.user_id:
        return jsonify({'code': 403, 'data': None, 'message': '只能删除自己发布的作业'}), 403

    db.session.delete(assignment)
    db.session.commit()
    return jsonify({'code': 200, 'data': None, 'message': '删除成功'})
