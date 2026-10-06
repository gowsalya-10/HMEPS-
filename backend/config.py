import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'hmeps-secret-key-super-secure'
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/hmeps'
    MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME') or 'hmeps'
