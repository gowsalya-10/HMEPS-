import jwt
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, g
from config import Config
from prescription_safety.database import get_db
from prescription_safety.middleware.auth import jwt_required

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    db = get_db()
    user = db.users.find_one({"email": email})

    if not user or user.get("password") != password:  # Simple check for demo/seed data
        return jsonify({"error": "Invalid email or password"}), 401

    payload = {
        "user_id": str(user["_id"]),
        "name": user.get("name", "User"),
        "email": user.get("email"),
        "role": user.get("role", "doctor"),
        "exp": datetime.utcnow() + timedelta(hours=Config.JWT_ACCESS_TOKEN_EXPIRES_HOURS)
    }

    token = jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": user.get("role")
        }
    })

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "doctor").strip().lower()

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    if role not in ["doctor", "pharmacist", "nurse", "admin"]:
        return jsonify({"error": "Invalid role specified"}), 400

    db = get_db()
    if db.users.find_one({"email": email}):
        return jsonify({"error": "User already exists with this email"}), 400

    user_doc = {
        "name": name,
        "email": email,
        "password": password,
        "role": role,
        "created_at": datetime.utcnow().isoformat()
    }
    result = db.users.insert_one(user_doc)

    return jsonify({
        "message": "User registered successfully",
        "user_id": str(result.inserted_id)
    }), 201

@auth_bp.route("/me", methods=["GET"])
@jwt_required
def me():
    return jsonify({"user": g.current_user})

