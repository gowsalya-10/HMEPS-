from datetime import datetime

from flask import Blueprint, jsonify, request

from app.database import get_db
from app.middleware.auth import require_auth, require_roles

reports_bp = Blueprint("reports_bp", __name__)


def parse_date(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except Exception:
        return None


@reports_bp.route("/errors", methods=["GET"])
@require_auth
@require_roles("ADMIN")
def medical_error_report():
    db = get_db()
    records = list(db["medical_errors"].find({}))
    start_date = parse_date(request.args.get("start_date"))
    end_date = parse_date(request.args.get("end_date"))
    severity = request.args.get("severity")
    error_type = request.args.get("error_type")
    department = request.args.get("department")

    filtered = []
    for record in records:
        created = parse_date(record.get("created_at"))
        if start_date and created and created < start_date:
            continue
        if end_date and created and created > end_date:
            continue
        if severity and str(record.get("severity", "")).upper() != severity.upper():
            continue
        if error_type and str(record.get("error_type", "")).upper() != error_type.upper():
            continue
        if department and str(record.get("department", "")).upper() != department.upper():
            continue
        filtered.append(record)

    return jsonify({"success": True, "records": filtered, "count": len(filtered)})


@reports_bp.route("/alerts", methods=["GET"])
@require_auth
@require_roles("ADMIN")
def safety_alert_report():
    db = get_db()
    records = list(db["safety_alerts"].find({}))
    start_date = parse_date(request.args.get("start_date"))
    end_date = parse_date(request.args.get("end_date"))
    severity = request.args.get("severity")
    department = request.args.get("department")

    filtered = []
    for record in records:
        created = parse_date(record.get("created_at"))
        if start_date and created and created < start_date:
            continue
        if end_date and created and created > end_date:
            continue
        if severity and str(record.get("severity", "")).upper() != severity.upper():
            continue
        if department and str(record.get("department", "")).upper() != department.upper():
            continue
        filtered.append(record)

    return jsonify({"success": True, "records": filtered, "count": len(filtered)})
