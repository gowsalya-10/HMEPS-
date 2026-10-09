from datetime import datetime

from flask import Blueprint, g, jsonify, request
from werkzeug.security import generate_password_hash

from app.database import get_db
from app.middleware.auth import create_token, log_successful_login, require_auth, validate_login
from app.utils import audit_event, get_user_safe, serialise_record


auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = (payload.get("password") or "").strip()

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required"}), 400

    user, error = validate_login(email, password)
    if error:
        return jsonify({"success": False, "message": error}), 401

    token = create_token(user)
    db = get_db()
    db["users"].update_one({"user_id": user["user_id"]}, {"$set": {"last_login": datetime.utcnow().isoformat()}})
    updated_user = db["users"].find_one({"user_id": user["user_id"]})

    log_successful_login(updated_user["user_id"], "User logged in successfully")

    return jsonify({
        "success": True,
        "token": token,
        "user": get_user_safe(serialise_record(updated_user)),
    })


@auth_bp.route("/logout", methods=["POST"])
@require_auth
def logout():
    user = g.current_user
    audit_event(
        user_id=user["user_id"],
        action="User logout",
        module="authentication",
        target_id=user["user_id"],
        description="User logged out successfully",
    )
    return jsonify({"success": True, "message": "Logged out successfully"})


@auth_bp.route("/me", methods=["GET"])
@require_auth
def me():
    return jsonify({"success": True, "user": get_user_safe(serialise_record(g.current_user))})
