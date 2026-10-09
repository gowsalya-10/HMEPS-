from functools import wraps
from datetime import datetime, timedelta

import jwt
from flask import g, jsonify, request
from werkzeug.security import check_password_hash

from app.config import Config
from app.database import get_db
from app.utils import audit_event, get_user_safe


def create_token(user):
    payload = {
        "user_id": user["user_id"],
        "email": user["email"],
        "role": user["role"],
        "exp": datetime.utcnow() + timedelta(hours=12),
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")


def decode_token(token):
    return jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])


def get_current_user_from_token():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except Exception:
        return None

    db = get_db()
    return db["users"].find_one({"user_id": payload.get("user_id")})


def require_auth(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        user = get_current_user_from_token()
        if not user:
            return jsonify({"success": False, "message": "Authentication required"}), 401
        if user.get("status") != "ACTIVE":
            return jsonify({"success": False, "message": "Inactive account"}), 403
        g.current_user = user
        return func(*args, **kwargs)

    return wrapper


def require_roles(*roles):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            user = getattr(g, "current_user", None)
            if not user:
                return jsonify({"success": False, "message": "Authentication required"}), 401
            if user.get("role") not in roles:
                return jsonify({"success": False, "message": "Forbidden: insufficient permissions"}), 403
            return func(*args, **kwargs)

        return wrapper

    return decorator


def validate_login(email, password):
    db = get_db()
    user = db["users"].find_one({"email": email})
    if not user:
        return None, "Invalid email or password"
    if not check_password_hash(user.get("password_hash", ""), password):
        return None, "Invalid email or password"
    if user.get("status") != "ACTIVE":
        return None, "Account is inactive"
    return user, None


def current_user_payload():
    user = getattr(g, "current_user", None)
    if not user:
        return None
    return get_user_safe(user)


def log_successful_login(user_id, description="User logged in successfully"):
    audit_event(
        user_id=user_id,
        action="User login",
        module="authentication",
        target_id=user_id,
        description=description,
    )
