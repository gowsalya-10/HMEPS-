import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt-secret")
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/hmeps")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "hmeps")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
