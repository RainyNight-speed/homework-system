from flask import Blueprint, request, jsonify
from models import db, Submission, Grade
from middleware.auth import login_required, teacher_required
from services.ai_service import ai_grade_assignment
from routes.notification_bp import send_notification

grade_bp = Blueprint('grade', __name__)


@grade_bp.route('/<int:sid>', methods=['POST'])
@teacher_required
def manual_grade(sid):
    submission = Submission.query.get(sid)
    if not submission:
        return jsonify({'code': 404, 'data': None, 'message': '提交记录不存在'}), 404

    data = request.get_json()
    score = data.get('score')
    comment = data.get('comment', '').strip()

    if score is None:
        return jsonify({'code': 400, 'data': None, 'message': '分数必填'}), 400

    grade = Grade.query.filter_by(submission_id=sid).first()
    if grade:
        grade.score = score
        grade.teacher_comment = comment
    else:
        grade = Grade(submission_id=sid, score=score, teacher_comment=comment)
        db.session.add(grade)

    db.session.commit()

    # 发送批改通知给学生
    assignment = submission.assignment
    send_notification(
        submission.student_id, 'grade',
        '作业批改完成',
        f'你的作业《{assignment.title}》已批改，得分：{score}/{assignment.max_score}',
        assignment.id
    )
    db.session.commit()

    return jsonify({'code': 200, 'data': grade.to_dict(), 'message': '批改成功'})


@grade_bp.route('/<int:sid>/ai', methods=['POST'])
@teacher_required
def ai_grade(sid):
    submission = Submission.query.get(sid)
    if not submission:
        return jsonify({'code': 404, 'data': None, 'message': '提交记录不存在'}), 404

    if not submission.content:
        return jsonify({'code': 400, 'data': None, 'message': '该提交无文本内容，无法AI批改'}), 400

    assignment_title = submission.assignment.title if submission.assignment else '未知作业'
    try:
        result = ai_grade_assignment(assignment_title, submission.content)
    except Exception as e:
        return jsonify({'code': 500, 'data': None, 'message': f'AI批改失败: {str(e)}'}), 500

    grade = Grade.query.filter_by(submission_id=sid).first()
    if grade:
        grade.ai_score = result.get('score')
        grade.ai_comment = result.get('comment')
    else:
        grade = Grade(
            submission_id=sid,
            ai_score=result.get('score'),
            ai_comment=result.get('comment')
        )
        db.session.add(grade)

    db.session.commit()
    return jsonify({'code': 200, 'data': grade.to_dict(), 'message': 'AI批改完成'})
