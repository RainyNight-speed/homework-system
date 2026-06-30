import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g
from config import Config


def generate_token(user_id, role):
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=Config.JWT_EXPIRE_HOURS)
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')


def decode_token(token):
    return jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'code': 401, 'data': None, 'message': '未提供认证令牌'}), 401

        token = auth_header.split(' ')[1]
        try:
            payload = decode_token(token)
            g.user_id = payload['user_id']
            g.role = payload['role']
        except jwt.ExpiredSignatureError:
            return jsonify({'code': 401, 'data': None, 'message': '令牌已过期'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'code': 401, 'data': None, 'message': '无效令牌'}), 401

        return f(*args, **kwargs)
    return decorated


def teacher_required(f):
    @wraps(f)
    @login_required
    def decorated(*args, **kwargs):
        if g.role != 'teacher':
            return jsonify({'code': 403, 'data': None, 'message': '仅教师可访问'}), 403
        return f(*args, **kwargs)
    return decorated


def student_required(f):
    @wraps(f)
    @login_required
    def decorated(*args, **kwargs):
        if g.role != 'student':
            return jsonify({'code': 403, 'data': None, 'message': '仅学生可访问'}), 403
        return f(*args, **kwargs)
    return decorated
