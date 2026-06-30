from flask import Blueprint, request, jsonify, g
from models import db, Course, CourseClass, Class
from middleware.auth import login_required, teacher_required

course_bp = Blueprint('course', __name__)


@course_bp.route('', methods=['GET'])
@login_required
def list_courses():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)

    query = Course.query
    if g.role == 'teacher':
        query = query.filter_by(teacher_id=g.user_id)
    elif g.role == 'student':
        from models import User
        user = User.query.get(g.user_id)
        if user and user.class_id:
            query = query.join(CourseClass).filter(CourseClass.class_id == user.class_id)
        else:
            query = query.filter(False)

    pagination = query.order_by(Course.created_at.desc()) \
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'code': 200,
        'data': {
            'items': [c.to_dict() for c in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'per_page': pagination.per_page,
            'pages': pagination.pages
        },
        'message': 'success'
    })


@course_bp.route('', methods=['POST'])
@teacher_required
def create_course():
    data = request.get_json()
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    class_ids = data.get('class_ids', [])

    if not name:
        return jsonify({'code': 400, 'data': None, 'message': '课程名称必填'}), 400

    course = Course(teacher_id=g.user_id, name=name, description=description)
    db.session.add(course)
    db.session.flush()

    for cid in class_ids:
        cls = Class.query.get(cid)
        if cls:
            cc = CourseClass(course_id=course.id, class_id=cid)
            db.session.add(cc)

    db.session.commit()
    return jsonify({'code': 200, 'data': course.to_dict(), 'message': '课程创建成功'})


@course_bp.route('/<int:cid>', methods=['GET'])
@login_required
def get_course(cid):
    course = Course.query.get(cid)
    if not course:
        return jsonify({'code': 404, 'data': None, 'message': '课程不存在'}), 404

    data = course.to_dict()
    # 附加每个班级的学生列表
    from models import User
    for cc in data['classes']:
        students = User.query.filter_by(class_id=cc['class_id'], role='student').order_by(User.name).all()
        cc['students'] = [s.to_dict() for s in students]
    return jsonify({'code': 200, 'data': data, 'message': 'success'})


@course_bp.route('/<int:cid>', methods=['PUT'])
@teacher_required
def update_course(cid):
    course = Course.query.get(cid)
    if not course:
        return jsonify({'code': 404, 'data': None, 'message': '课程不存在'}), 404
    if course.teacher_id != g.user_id:
        return jsonify({'code': 403, 'data': None, 'message': '只能编辑自己的课程'}), 403

    data = request.get_json()
    if 'name' in data:
        course.name = data['name'].strip()
    if 'description' in data:
        course.description = data['description'].strip()
    if 'class_ids' in data:
        for cc in course.course_classes:
            db.session.delete(cc)
        for cid_val in data['class_ids']:
            cls = Class.query.get(cid_val)
            if cls:
                db.session.add(CourseClass(course_id=course.id, class_id=cid_val))

    db.session.commit()
    return jsonify({'code': 200, 'data': course.to_dict(), 'message': '更新成功'})


@course_bp.route('/<int:cid>', methods=['DELETE'])
@teacher_required
def delete_course(cid):
    course = Course.query.get(cid)
    if not course:
        return jsonify({'code': 404, 'data': None, 'message': '课程不存在'}), 404
    if course.teacher_id != g.user_id:
        return jsonify({'code': 403, 'data': None, 'message': '只能删除自己的课程'}), 403

    if course.course_classes:
        from models import Assignment
        for cc in course.course_classes:
            if Assignment.query.filter_by(course_class_id=cc.id).first():
                return jsonify({'code': 400, 'data': None, 'message': '该课程下已有作业，无法删除'}), 400

    db.session.delete(course)
    db.session.commit()
    return jsonify({'code': 200, 'data': None, 'message': '删除成功'})
