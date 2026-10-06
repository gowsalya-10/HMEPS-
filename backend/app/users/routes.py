from datetime import datetime

from flask import Blueprint, g, jsonify, request
from werkzeug.security import generate_password_hash

from app.database import get_db
from app.middleware.auth import require_auth, require_roles
from app.utils import audit_event, create_notification, get_user_safe

users_bp = Blueprint("users_bp", __name__)
VALID_ROLES = ["ADMIN", "DOCTOR", "NURSE", "PHARMACIST"]
VALID_STATUS = ["ACTIVE", "INACTIVE"]


def sanitize_user(user):
    return get_user_safe(user)


@users_bp.route("/users", methods=["GET"])
@require_auth
@require_roles("ADMIN")
def list_users():
    query = request.args.get("search", "").strip()
    role = request.args.get("role")
    department = request.args.get("department")
    status = request.args.get("status")
    page = max(1, int(request.args.get("page", 1)))
    per_page = min(50, max(1, int(request.args.get("per_page", 10))))

    db = get_db()
    users = db["users"].find({})

    filtered = []
    for user in users:
        name = (user.get("name") or "").lower()
        email = (user.get("email") or "").lower()
        if query and query.lower() not in f"{name} {email}":
            continue
        if role and user.get("role") != role:
            continue
        if department and user.get("department") != department:
            continue
        if status and user.get("status") != status:
            continue
        filtered.append(user)

    total = len(filtered)
    start = (page - 1) * per_page
    paginated = filtered[start:start + per_page]

    return jsonify({
        "success": True,
        "users": [sanitize_user(user) for user in paginated],
        "total": total,
        "page": page,
        "per_page": per_page,
    })


@users_bp.route("/users", methods=["POST"])
@require_auth
@require_roles("ADMIN")
def create_user():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = (payload.get("password") or "").strip()
    role = (payload.get("role") or "").upper()
    department = (payload.get("department") or "").strip()
    status = (payload.get("status") or "ACTIVE").upper()

    if not all([name, email, password, role, department]):
        return jsonify({"success": False, "message": "Name, email, password, role and department are required"}), 400
    if role not in VALID_ROLES:
        return jsonify({"success": False, "message": "Unsupported role"}), 400
    if status not in VALID_STATUS:
        return jsonify({"success": False, "message": "Unsupported status"}), 400

    db = get_db()
    if db["users"].find_one({"email": email}):
        return jsonify({"success": False, "message": "User with this email already exists"}), 409

    new_user = {
        "user_id": f"user-{int(datetime.utcnow().timestamp() * 1000)}",
        "name": name,
        "email": email,
        "password_hash": generate_password_hash(password),
        "role": role,
        "department": department,
        "status": status,
        "created_at": datetime.utcnow().isoformat(),
        "last_login": None,
    }
    db["users"].insert_one(new_user)

    audit_event(
        user_id=g.current_user["user_id"],
        action="User created",
        module="administration",
        target_id=new_user["user_id"],
        description=f"User {name} was created in department {department}",
    )
    create_notification(new_user["user_id"], "Your account has been created in the HMEPS system.", "info")

    return jsonify({"success": True, "user": sanitize_user(new_user)}), 201


@users_bp.route("/users/<user_id>", methods=["PUT"])
@require_auth
@require_roles("ADMIN")
def update_user(user_id):
    payload = request.get_json(silent=True) or {}
    db = get_db()
    user = db["users"].find_one({"user_id": user_id})
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    updates = {}
    if "name" in payload:
        updates["name"] = payload["name"].strip()
    if "email" in payload:
        email = payload["email"].strip().lower()
        if db["users"].find_one({"email": email, "user_id": {"$ne": user_id}}):
            return jsonify({"success": False, "message": "Email already in use"}), 409
        updates["email"] = email
    if "role" in payload:
        role = payload["role"].upper()
        if role not in VALID_ROLES:
            return jsonify({"success": False, "message": "Unsupported role"}), 400
        updates["role"] = role
    if "department" in payload:
        updates["department"] = payload["department"].strip()
    if "status" in payload:
        status = payload["status"].upper()
        if status not in VALID_STATUS:
            return jsonify({"success": False, "message": "Unsupported status"}), 400
        updates["status"] = status
    if "password" in payload and payload["password"]:
        updates["password_hash"] = generate_password_hash(payload["password"])

    if updates:
        db["users"].update_one({"user_id": user_id}, {"$set": updates})

    if payload.get("status") and payload["status"].upper() == "INACTIVE":
        audit_event(
            user_id=g.current_user["user_id"],
            action="User disabled",
            module="administration",
            target_id=user_id,
            description=f"User {user['name']} was disabled",
        )
        create_notification(user_id, "Your account has been disabled by an administrator.", "warning")
    else:
        audit_event(
            user_id=g.current_user["user_id"],
            action="User modified",
            module="administration",
            target_id=user_id,
            description="User record updated",
        )

    updated = db["users"].find_one({"user_id": user_id})
    return jsonify({"success": True, "user": sanitize_user(updated)})


@users_bp.route("/users/<user_id>", methods=["DELETE"])
@require_auth
@require_roles("ADMIN")
def delete_user(user_id):
    db = get_db()
    user = db["users"].find_one({"user_id": user_id})
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    db["users"].update_one({"user_id": user_id}, {"$set": {"status": "INACTIVE"}})
    audit_event(
        user_id=g.current_user["user_id"],
        action="User disabled",
        module="administration",
        target_id=user_id,
        description=f"User {user['name']} was disabled",
    )
    create_notification(user_id, "Your account has been disabled by an administrator.", "warning")
    return jsonify({"success": True, "message": "User disabled successfully"})
