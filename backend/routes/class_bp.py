import csv
import io
import bcrypt
from flask import Blueprint, request, jsonify
from models import db, Class, User
from middleware.auth import login_required, teacher_required

class_bp = Blueprint('class', __name__)


@class_bp.route('', methods=['GET'])
def list_classes():
    classes = Class.query.order_by(Class.name).all()
    return jsonify({
        'code': 200,
        'data': [c.to_dict() for c in classes],
        'message': 'success'
    })


@class_bp.route('/<int:cid>', methods=['GET'])
@login_required
def get_class(cid):
    cls = Class.query.get(cid)
    if not cls:
        return jsonify({'code': 404, 'data': None, 'message': '班级不存在'}), 404
    students = User.query.filter_by(class_id=cid, role='student').order_by(User.name).all()
    data = cls.to_dict()
    data['students'] = [s.to_dict() for s in students]
    return jsonify({'code': 200, 'data': data, 'message': 'success'})


@class_bp.route('', methods=['POST'])
@teacher_required
def create_class():
    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'code': 400, 'data': None, 'message': '班级名称必填'}), 400

    if Class.query.filter_by(name=name).first():
        return jsonify({'code': 400, 'data': None, 'message': '班级名称已存在'}), 400

    cls = Class(name=name)
    db.session.add(cls)
    db.session.commit()
    return jsonify({'code': 200, 'data': cls.to_dict(), 'message': '班级创建成功'})


@class_bp.route('/<int:cid>', methods=['PUT'])
@teacher_required
def update_class(cid):
    cls = Class.query.get(cid)
    if not cls:
        return jsonify({'code': 404, 'data': None, 'message': '班级不存在'}), 404

    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'code': 400, 'data': None, 'message': '班级名称必填'}), 400

    existing = Class.query.filter_by(name=name).first()
    if existing and existing.id != cid:
        return jsonify({'code': 400, 'data': None, 'message': '班级名称已存在'}), 400

    cls.name = name
    db.session.commit()
    return jsonify({'code': 200, 'data': cls.to_dict(), 'message': '更新成功'})


@class_bp.route('/<int:cid>', methods=['DELETE'])
@teacher_required
def delete_class(cid):
    cls = Class.query.get(cid)
    if not cls:
        return jsonify({'code': 404, 'data': None, 'message': '班级不存在'}), 404

    student_count = User.query.filter_by(class_id=cid, role='student').count()
    if student_count > 0:
        return jsonify({'code': 400, 'data': None, 'message': f'该班级下有{student_count}名学生，无法删除'}), 400

    db.session.delete(cls)
    db.session.commit()
    return jsonify({'code': 200, 'data': None, 'message': '删除成功'})


@class_bp.route('/<int:cid>/import', methods=['POST'])
@teacher_required
def import_students(cid):
    """导入学生名单（CSV: username, name, password）"""
    cls = Class.query.get(cid)
    if not cls:
        return jsonify({'code': 404, 'data': None, 'message': '班级不存在'}), 404

    file = request.files.get('file')
    if not file:
        return jsonify({'code': 400, 'data': None, 'message': '请上传CSV文件'}), 400

    try:
        content = file.read().decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(content))
        success, skipped, errors = 0, 0, []
        for i, row in enumerate(reader, start=2):
            username = (row.get('username') or '').strip()
            name = (row.get('name') or '').strip()
            password = (row.get('password') or '123456').strip()

            if not username or not name:
                errors.append(f'第{i}行：用户名或姓名为空')
                continue
            if User.query.filter_by(username=username).first():
                skipped += 1
                continue

            hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user = User(username=username, password=hashed, name=name, role='student', class_id=cid)
            db.session.add(user)
            success += 1

        db.session.commit()
        return jsonify({
            'code': 200,
            'data': {'success': success, 'skipped': skipped, 'errors': errors},
            'message': f'导入完成：成功{success}人，跳过{skipped}人（已存在），错误{len(errors)}条'
        })
    except Exception as e:
        return jsonify({'code': 400, 'data': None, 'message': f'文件解析失败：{str(e)}'}), 400
