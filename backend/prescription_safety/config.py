import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "hmeps-super-secret-jwt-key-2026-production-secure-key-32chars")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "hmeps-super-secret-jwt-key-2026-production-secure-key-32chars")
    JWT_ACCESS_TOKEN_EXPIRES_HOURS = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", "24"))
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/hmeps_db")
    DB_NAME = os.getenv("DB_NAME", "hmeps_db")
    PORT = int(os.getenv("PORT", "5000"))
    DEBUG = os.getenv("FLASK_ENV", "development") == "development"

