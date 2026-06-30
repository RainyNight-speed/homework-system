import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

class Config:
    # MySQL
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '3306')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'homework_system')

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        f"?charset=utf8mb4"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-change-me')
    JWT_EXPIRE_HOURS = int(os.getenv('JWT_EXPIRE_HOURS', '24'))

    # Qwen API
    QWEN_API_KEY = os.getenv('QWEN_API_KEY', '')
    QWEN_MODEL = os.getenv('QWEN_MODEL', 'qwen-turbo')
    QWEN_BASE_URL = os.getenv('QWEN_BASE_URL', 'https://llm-71eppg2mcy2j2qlf.cn-beijing.maas.aliyuncs.com/compatible-mode/v1')

    # Flask
    DEBUG = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'

    # File upload
    UPLOAD_DIR = os.getenv('UPLOAD_DIR', './uploads')
    MAX_FILE_SIZE_MB = int(os.getenv('MAX_FILE_SIZE_MB', '10'))
    ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.txt', '.zip', '.rar',
                          '.png', '.jpg', '.jpeg', '.gif', '.xls', '.xlsx',
                          '.ppt', '.pptx', '.py', '.java', '.c', '.cpp',
                          '.js', '.html', '.css', '.md'}
