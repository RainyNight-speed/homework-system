from flask import Blueprint, jsonify, Response, g
from sqlalchemy import text
from models import db, User, Assignment
from middleware.auth import login_required, teacher_required
import csv
import io

statistics_bp = Blueprint('statistics', __name__)


@statistics_bp.route('/assignment/<int:aid>', methods=['GET'])
@teacher_required
def assignment_statistics(aid):
    assignment = Assignment.query.get(aid)
    if not assignment:
        return jsonify({'code': 404, 'data': None, 'message': '作业不存在'}), 404

    # 按班级统计学生数
    if assignment.course_class_id:
        total = User.query.filter_by(
            class_id=assignment.course_class.class_id, role='student'
        ).count()
    else:
        total = User.query.filter_by(role='student').count()

    sql = text("""
        SELECT
            COUNT(DISTINCT s.id) as submitted_count,
            COUNT(g.id) as graded_count,
            ROUND(AVG(g.score), 1) as avg_score,
            MAX(g.score) as max_score,
            MIN(g.score) as min_score,
            SUM(CASE WHEN g.score >= 90 THEN 1 ELSE 0 END) as excellent,
            SUM(CASE WHEN g.score >= 60 AND g.score < 90 THEN 1 ELSE 0 END) as pass_count,
            SUM(CASE WHEN g.score < 60 THEN 1 ELSE 0 END) as fail_count
        FROM assignments a
        LEFT JOIN submissions s ON a.id = s.assignment_id
        LEFT JOIN grades g ON s.id = g.submission_id
        WHERE a.id = :aid
    """)
    result = db.session.execute(sql, {'aid': aid}).fetchone()

    submitted = result.submitted_count or 0

    return jsonify({
        'code': 200,
        'data': {
            'total_students': total,
            'submitted_count': submitted,
            'not_submitted': total - submitted,
            'graded_count': result.graded_count or 0,
            'avg_score': result.avg_score,
            'max_score': result.max_score,
            'min_score': result.min_score,
            'excellent': result.excellent or 0,
            'pass': result.pass_count or 0,
            'fail': result.fail_count or 0
        },
        'message': 'success'
    })


@statistics_bp.route('/class', methods=['GET'])
@teacher_required
def class_statistics():
    sql = text("""
        SELECT
            a.id as assignment_id,
            a.title,
            COUNT(DISTINCT s.id) as submitted_count,
            ROUND(AVG(g.score), 1) as avg_score,
            SUM(CASE WHEN g.score >= 90 THEN 1 ELSE 0 END) as excellent,
            SUM(CASE WHEN g.score >= 60 AND g.score < 90 THEN 1 ELSE 0 END) as pass_count,
            SUM(CASE WHEN g.score < 60 THEN 1 ELSE 0 END) as fail_count
        FROM assignments a
        LEFT JOIN submissions s ON a.id = s.assignment_id
        LEFT JOIN grades g ON s.id = g.submission_id
        GROUP BY a.id, a.title
        ORDER BY a.created_at DESC
    """)
    rows = db.session.execute(sql).fetchall()

    total_students = User.query.filter_by(role='student').count()

    return jsonify({
        'code': 200,
        'data': {
            'total_students': total_students,
            'assignments': [
                {
                    'assignment_id': r.assignment_id,
                    'title': r.title,
                    'submitted_count': r.submitted_count or 0,
                    'not_submitted': total_students - (r.submitted_count or 0),
                    'avg_score': r.avg_score,
                    'excellent': r.excellent or 0,
                    'pass': r.pass_count or 0,
                    'fail': r.fail_count or 0
                }
                for r in rows
            ]
        },
        'message': 'success'
    })


@statistics_bp.route('/student/<int:sid>', methods=['GET'])
@login_required
def student_statistics(sid):
    # 学生只能查看自己的成绩，教师可查看任意学生
    if g.role == 'student' and g.user_id != sid:
        return jsonify({'code': 403, 'data': None, 'message': '只能查看自己的成绩'}), 403

    sql = text("""
        SELECT
            a.title,
            a.max_score,
            g.score,
            g.ai_score,
            g.teacher_comment,
            g.ai_comment,
            s.is_late,
            s.submitted_at
        FROM assignments a
        LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = :sid
        LEFT JOIN grades g ON s.id = g.submission_id
        ORDER BY a.created_at DESC
    """)
    rows = db.session.execute(sql, {'sid': sid}).fetchall()

    return jsonify({
        'code': 200,
        'data': [
            {
                'title': r.title,
                'max_score': r.max_score,
                'score': r.score,
                'ai_score': r.ai_score,
                'teacher_comment': r.teacher_comment,
                'ai_comment': r.ai_comment,
                'is_late': bool(r.is_late) if r.is_late is not None else None,
                'submitted_at': r.submitted_at.isoformat() if r.submitted_at else None
            }
            for r in rows
        ],
        'message': 'success'
    })


@statistics_bp.route('/assignment/<int:aid>/export', methods=['GET'])
@teacher_required
def export_assignment_grades(aid):
    """导出某次作业的成绩为CSV"""
    sql = text("""
        SELECT
            u.name as student_name,
            COALESCE(c.name, u.class_name) as class_name,
            s.submitted_at,
            s.is_late,
            g.score,
            g.ai_score,
            g.teacher_comment,
            g.ai_comment
        FROM users u
        LEFT JOIN classes c ON u.class_id = c.id
        LEFT JOIN submissions s ON u.id = s.student_id AND s.assignment_id = :aid
        LEFT JOIN grades g ON s.id = g.submission_id
        WHERE u.role = 'student'
        ORDER BY class_name, u.name
    """)
    rows = db.session.execute(sql, {'aid': aid}).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['姓名', '班级', '提交时间', '是否逾期', '教师评分', 'AI评分', '教师评语', 'AI评语'])
    for r in rows:
        writer.writerow([
            r.student_name,
            r.class_name or '',
            r.submitted_at.strftime('%Y-%m-%d %H:%M') if r.submitted_at else '未提交',
            '是' if r.is_late else ('否' if r.is_late is not None else ''),
            r.score if r.score is not None else '',
            r.ai_score if r.ai_score is not None else '',
            r.teacher_comment or '',
            r.ai_comment or ''
        ])

    output.seek(0)
    return Response(
        '﻿' + output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename=grades_assignment_{aid}.csv'}
    )
