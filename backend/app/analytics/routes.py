from collections import Counter
from datetime import datetime

from flask import Blueprint, jsonify, request

from app.database import get_db
from app.middleware.auth import require_auth, require_roles

analytics_bp = Blueprint("analytics_bp", __name__)


def month_bucket(date_value):
    if not date_value:
        return "Unknown"
    try:
        if isinstance(date_value, str):
            dt = datetime.fromisoformat(date_value)
        else:
            dt = date_value
        return dt.strftime("%Y-%m")
    except Exception:
        return "Unknown"


@analytics_bp.route("/overview", methods=["GET"])
@require_auth
@require_roles("ADMIN", "DOCTOR", "NURSE", "PHARMACIST")
def overview():
    db = get_db()
    patients = db["patients"].find({})
    prescriptions = db["prescriptions"].find({})
    safety_alerts = db["safety_alerts"].find({})
    medical_errors = db["medical_errors"].find({})
    users = db["users"].find({})

    doctors = sum(1 for user in users if user.get("role") == "DOCTOR")
    nurses = sum(1 for user in users if user.get("role") == "NURSE")
    pharmacists = sum(1 for user in users if user.get("role") == "PHARMACIST")
    active_alerts = sum(1 for alert in safety_alerts if alert.get("status") != "resolved")
    critical_alerts = sum(1 for alert in safety_alerts if str(alert.get("severity", "")).upper() == "CRITICAL")
    error_count = sum(1 for error in medical_errors)

    total_safety_checks = max(1, len(list(safety_alerts)))
    error_detection_rate = (error_count / total_safety_checks) * 100 if total_safety_checks else 0

    patients_list = list(patients)
    prescriptions_list = list(prescriptions)
    safety_list = list(safety_alerts)
    errors_list = list(medical_errors)

    return jsonify({
        "success": True,
        "summary": {
            "total_patients": len(patients_list),
            "total_doctors": doctors,
            "total_nurses": nurses,
            "total_pharmacists": pharmacists,
            "total_prescriptions": len(prescriptions_list),
            "active_safety_alerts": active_alerts,
            "critical_alerts": critical_alerts,
            "medical_errors_detected": error_count,
            "error_detection_rate": round(error_detection_rate, 2),
        },
        "charts": {
            "errors_by_type": [
                {"name": name, "value": value}
                for name, value in sorted(Counter(item.get("error_type", "Unknown") for item in errors_list).items())
            ],
            "alerts_by_severity": [
                {"name": name, "value": value}
                for name, value in sorted(Counter(str(item.get("severity", "Unknown")).upper() for item in safety_list).items())
            ],
            "prescriptions_over_time": [
                {"name": bucket, "value": value}
                for bucket, value in sorted(Counter(month_bucket(item.get("created_at")) for item in prescriptions_list).items())
            ],
            "medical_errors_over_time": [
                {"name": bucket, "value": value}
                for bucket, value in sorted(Counter(month_bucket(item.get("created_at")) for item in errors_list).items())
            ],
            "user_activity": [
                {"name": name, "value": value}
                for name, value in sorted(Counter(user.get("role", "UNKNOWN") for user in users).items())
            ],
        },
    })


@analytics_bp.route("/errors", methods=["GET"])
@require_auth
@require_roles("ADMIN", "DOCTOR", "NURSE", "PHARMACIST")
def error_trends():
    db = get_db()
    errors = db["medical_errors"].find({})
    error_list = list(errors)

    series = [
        {"name": bucket, "value": count}
        for bucket, count in sorted(Counter(month_bucket(item.get("created_at")) for item in error_list).items())
    ]
    return jsonify({"success": True, "data": series})


@analytics_bp.route("/alerts", methods=["GET"])
@require_auth
@require_roles("ADMIN", "DOCTOR", "NURSE", "PHARMACIST")
def alert_distribution():
    db = get_db()
    alerts = db["safety_alerts"].find({})
    alert_list = list(alerts)

    series = [
        {"name": severity, "value": count}
        for severity, count in Counter(str(alert.get("severity", "Unknown")).upper() for alert in alert_list).items()
    ]
    return jsonify({"success": True, "data": series})
