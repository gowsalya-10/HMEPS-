from db import get_db as get_shared_db

def get_db():
    return get_shared_db()

