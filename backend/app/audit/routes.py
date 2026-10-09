from flask import Blueprint, jsonify, request

from app.database import get_db
from app.middleware.auth import require_auth, require_roles
from app.utils import serialise_record


audit_bp = Blueprint("audit_bp", __name__)


@audit_bp.route("/audit-logs", methods=["GET"])
@require_auth
@require_roles("ADMIN")
def list_logs():
    search = request.args.get("search", "").strip().lower()
    user_id = request.args.get("user_id")
    action = request.args.get("action")
    module = request.args.get("module")
    page = max(1, int(request.args.get("page", 1)))
    per_page = min(50, max(1, int(request.args.get("per_page", 10))))

    db = get_db()
    logs = db["audit_logs"].find({})
    filtered = []
    for log in logs:
        haystack = f"{log.get('user_id', '')} {log.get('action', '')} {log.get('module', '')} {log.get('description', '')}".lower()
        if search and search not in haystack:
            continue
        if user_id and log.get("user_id") != user_id:
            continue
        if action and log.get("action") != action:
            continue
        if module and log.get("module") != module:
            continue
        filtered.append(log)

    filtered.sort(key=lambda item: item.get("timestamp", ""), reverse=True)
    total = len(filtered)
    start = (page - 1) * per_page
    records = filtered[start:start + per_page]

    return jsonify({
        "success": True,
        "logs": serialise_record(records),
        "total": total,
        "page": page,
        "per_page": per_page,
    })
