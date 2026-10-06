from flask import Blueprint, request, jsonify
from prescription_safety.database import get_db
from prescription_safety.middleware.auth import jwt_required

audit_bp = Blueprint("audit", __name__)

@audit_bp.route("/logs", methods=["GET"])
@jwt_required
def get_audit_logs():
    db = get_db()
    limit = int(request.args.get("limit", 50))
    logs = list(db.audit_logs.find({}, sort=[("created_at", -1)], limit=limit))
    for log in logs:
        log["_id"] = str(log["_id"])
    return jsonify({"logs": logs, "count": len(logs)})

