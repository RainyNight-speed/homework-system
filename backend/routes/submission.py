import os
import uuid
from flask import Blueprint, request, jsonify, g, send_from_directory
from datetime import datetime
from models import db, Submission, Assignment
from middleware.auth import login_required, student_required
from config import Config

submission_bp = Blueprint('submission', __name__)


def _validate_and_save_file(file_storage):
    """校验文件类型并保存，返回文件名或抛出异常"""
    ext = os.path.splitext(file_storage.filename)[1].lower()
    if ext not in Config.ALLOWED_EXTENSIONS:
        raise ValueError(f'不支持的文件类型: {ext}')
    filename = f"{uuid.uuid4().hex}{ext}"
    os.makedirs(Config.UPLOAD_DIR, exist_ok=True)
    file_storage.save(os.path.join(Config.UPLOAD_DIR, filename))
    return filename


@submission_bp.route('', methods=['POST'])
@student_required
def create_submission():
    data = request.form if request.form else request.get_json()
    if not data:
        return jsonify({'code': 400, 'data': None, 'message': '请求体为空'}), 400

    assignment_id = data.get('assignment_id')
    content = data.get('content', '').strip()

    if not assignment_id:
        return jsonify({'code': 400, 'data': None, 'message': '作业ID必填'}), 400

    assignment = Assignment.query.get(assignment_id)
    if not assignment:
        return jsonify({'code': 404, 'data': None, 'message': '作业不存在'}), 404

    existing = Submission.query.filter_by(
        assignment_id=assignment_id, student_id=g.user_id
    ).first()
    if existing:
        return jsonify({'code': 400, 'data': None, 'message': '已提交过该作业，请使用修改接口'}), 400

    is_late = datetime.utcnow() > assignment.due_date

    file_path = None
    if 'file' in request.files:
        f = request.files['file']
        if f.filename:
            try:
                file_path = _validate_and_save_file(f)
            except ValueError as e:
                return jsonify({'code': 400, 'data': None, 'message': str(e)}), 400

    submission = Submission(
        assignment_id=assignment_id,
        student_id=g.user_id,
        content=content,
        file_path=file_path,
        is_late=is_late
    )
    db.session.add(submission)
    db.session.commit()

    return jsonify({'code': 200, 'data': submission.to_dict(), 'message': '提交成功'})


@submission_bp.route('/<int:sid>', methods=['PUT'])
@student_required
def update_submission(sid):
    submission = Submission.query.get(sid)
    if not submission:
        return jsonify({'code': 404, 'data': None, 'message': '提交记录不存在'}), 404
    if submission.student_id != g.user_id:
        return jsonify({'code': 403, 'data': None, 'message': '只能修改自己的提交'}), 403

    assignment = Assignment.query.get(submission.assignment_id)
    if datetime.utcnow() > assignment.due_date:
        return jsonify({'code': 400, 'data': None, 'message': '已过截止时间，无法修改'}), 400

    data = request.form if request.form else request.get_json()
    if 'content' in data:
        submission.content = data['content'].strip()

    if 'file' in request.files:
        f = request.files['file']
        if f.filename:
            try:
                submission.file_path = _validate_and_save_file(f)
            except ValueError as e:
                return jsonify({'code': 400, 'data': None, 'message': str(e)}), 400

    db.session.commit()
    return jsonify({'code': 200, 'data': submission.to_dict(), 'message': '修改成功'})


@submission_bp.route('', methods=['GET'])
@login_required
def list_submissions():
    assignment_id = request.args.get('assignment_id')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)

    query = Submission.query
    if assignment_id:
        query = query.filter_by(assignment_id=assignment_id)
    if g.role == 'student':
        query = query.filter_by(student_id=g.user_id)

    pagination = query.order_by(Submission.submitted_at.desc()) \
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'code': 200,
        'data': {
            'items': [s.to_dict() for s in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'per_page': pagination.per_page,
            'pages': pagination.pages
        },
        'message': 'success'
    })


@submission_bp.route('/<int:sid>/status', methods=['GET'])
@student_required
def submission_status(sid):
    submission = Submission.query.get(sid)
    if not submission:
        return jsonify({'code': 404, 'data': None, 'message': '提交记录不存在'}), 404
    if submission.student_id != g.user_id:
        return jsonify({'code': 403, 'data': None, 'message': '无权查看'}), 403

    assignment = Assignment.query.get(submission.assignment_id)
    return jsonify({
        'code': 200,
        'data': {
            'is_late': submission.is_late,
            'can_edit': datetime.utcnow() <= assignment.due_date,
            'submitted_at': submission.submitted_at.isoformat(),
            'due_date': assignment.due_date.isoformat()
        },
        'message': 'success'
    })


@submission_bp.route('/files/<filename>', methods=['GET'])
@login_required
def download_file(filename):
    return send_from_directory(os.path.abspath(Config.UPLOAD_DIR), filename)


@submission_bp.route('/<int:sid>', methods=['DELETE'])
@student_required
def withdraw_submission(sid):
    """撤回提交（截止时间前可撤回）"""
    submission = Submission.query.get(sid)
    if not submission:
        return jsonify({'code': 404, 'data': None, 'message': '提交记录不存在'}), 404
    if submission.student_id != g.user_id:
        return jsonify({'code': 403, 'data': None, 'message': '只能撤回自己的提交'}), 403

    assignment = Assignment.query.get(submission.assignment_id)
    if datetime.utcnow() > assignment.due_date:
        return jsonify({'code': 400, 'data': None, 'message': '已过截止时间，无法撤回'}), 400

    # 删除关联的成绩记录
    from models import Grade
    grade = Grade.query.filter_by(submission_id=sid).first()
    if grade:
        db.session.delete(grade)

    # 删除上传的文件
    if submission.file_path:
        filepath = os.path.join(Config.UPLOAD_DIR, submission.file_path)
        if os.path.exists(filepath):
            os.remove(filepath)

    db.session.delete(submission)
    db.session.commit()
    return jsonify({'code': 200, 'data': None, 'message': '撤回成功'})
