import bcrypt
import time
from flask import Blueprint, request, jsonify, g
from models import db, User
from middleware.auth import generate_token, login_required

auth_bp = Blueprint('auth', __name__)

# 简易登录频率限制：{ip: [最近失败时间戳列表]}
_login_attempts = {}
_MAX_ATTEMPTS = 5
_WINDOW_SECONDS = 300


def _check_rate_limit(ip):
    """检查IP是否超出登录频率限制，返回True表示被限流"""
    now = time.time()
    attempts = _login_attempts.get(ip, [])
    # 清理过期记录
    attempts = [t for t in attempts if now - t < _WINDOW_SECONDS]
    _login_attempts[ip] = attempts
    return len(attempts) >= _MAX_ATTEMPTS


def _record_failure(ip):
    _login_attempts.setdefault(ip, []).append(time.time())


def _clear_attempts(ip):
    _login_attempts.pop(ip, None)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'code': 400, 'data': None, 'message': '请求体为空'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')
    name = data.get('name', '').strip()
    role = data.get('role', '')
    class_id = data.get('class_id')

    if not all([username, password, name, role]):
        return jsonify({'code': 400, 'data': None, 'message': '缺少必填字段'}), 400

    if role not in ('teacher', 'student'):
        return jsonify({'code': 400, 'data': None, 'message': '角色只能是 teacher 或 student'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'code': 400, 'data': None, 'message': '用户名已存在'}), 400

    if role == 'student' and class_id:
        from models import Class
        if not Class.query.get(class_id):
            return jsonify({'code': 400, 'data': None, 'message': '班级不存在'}), 400

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user = User(
        username=username, password=hashed, name=name, role=role,
        class_id=class_id if role == 'student' else None
    )
    db.session.add(user)
    db.session.commit()

    token = generate_token(user.id, user.role)
    return jsonify({
        'code': 200,
        'data': {'token': token, 'user': user.to_dict()},
        'message': '注册成功'
    })


@auth_bp.route('/login', methods=['POST'])
def login():
    ip = request.remote_addr or 'unknown'
    if _check_rate_limit(ip):
        return jsonify({'code': 429, 'data': None, 'message': '登录尝试过于频繁，请5分钟后再试'}), 429

    data = request.get_json()
    if not data:
        return jsonify({'code': 400, 'data': None, 'message': '请求体为空'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')

    user = User.query.filter_by(username=username).first()
    if not user:
        _record_failure(ip)
        return jsonify({'code': 401, 'data': None, 'message': '用户名或密码错误'}), 401

    # 兼容 bcrypt hash 和明文密码，首次登录自动升级为 hash
    if user.password.startswith('$2b$'):
        if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
            _record_failure(ip)
            return jsonify({'code': 401, 'data': None, 'message': '用户名或密码错误'}), 401
    elif user.password == password:
        user.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        db.session.commit()
    else:
        _record_failure(ip)
        return jsonify({'code': 401, 'data': None, 'message': '用户名或密码错误'}), 401

    _clear_attempts(ip)
    token = generate_token(user.id, user.role)
    return jsonify({
        'code': 200,
        'data': {'token': token, 'user': user.to_dict()},
        'message': '登录成功'
    })


@auth_bp.route('/users/me', methods=['GET'])
@login_required
def get_me():
    user = User.query.get(g.user_id)
    if not user:
        return jsonify({'code': 404, 'data': None, 'message': '用户不存在'}), 404
    return jsonify({'code': 200, 'data': user.to_dict(), 'message': 'success'})


@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    data = request.get_json()
    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')

    if not old_password or not new_password:
        return jsonify({'code': 400, 'data': None, 'message': '旧密码和新密码必填'}), 400

    if len(new_password) < 6:
        return jsonify({'code': 400, 'data': None, 'message': '新密码长度至少6位'}), 400

    user = User.query.get(g.user_id)
    if not bcrypt.checkpw(old_password.encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({'code': 400, 'data': None, 'message': '旧密码错误'}), 400

    user.password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db.session.commit()

    return jsonify({'code': 200, 'data': None, 'message': '密码修改成功'})
