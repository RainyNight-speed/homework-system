import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import db


def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = Config.SQLALCHEMY_TRACK_MODIFICATIONS
    app.config['MAX_CONTENT_LENGTH'] = Config.MAX_FILE_SIZE_MB * 1024 * 1024

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)

    from routes.auth import auth_bp
    from routes.assignment import assignment_bp
    from routes.submission import submission_bp
    from routes.grade import grade_bp
    from routes.statistics import statistics_bp
    from routes.class_bp import class_bp
    from routes.course_bp import course_bp
    from routes.notification_bp import notification_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(assignment_bp, url_prefix='/api/assignments')
    app.register_blueprint(submission_bp, url_prefix='/api/submissions')
    app.register_blueprint(grade_bp, url_prefix='/api/grades')
    app.register_blueprint(statistics_bp, url_prefix='/api/statistics')
    app.register_blueprint(class_bp, url_prefix='/api/classes')
    app.register_blueprint(course_bp, url_prefix='/api/courses')
    app.register_blueprint(notification_bp, url_prefix='/api/notifications')

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'code': 404, 'data': None, 'message': '资源不存在'}), 404

    @app.errorhandler(413)
    def request_entity_too_large(e):
        return jsonify({'code': 413, 'data': None, 'message': '文件大小超出限制'}), 413

    @app.errorhandler(500)
    def internal_error(e):
        db.session.rollback()
        return jsonify({'code': 500, 'data': None, 'message': '服务器内部错误'}), 500

    with app.app_context():
        db.create_all()

    return app


if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('FLASK_PORT', '5000'))
    app.run(host='0.0.0.0', port=port, debug=Config.DEBUG)
