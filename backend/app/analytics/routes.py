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
            dt = datetime.fromisoformat(date_value.replace("Z", "+00:00"))
        else:
            dt = date_value
        return dt.strftime("%Y-%m")
    except Exception:
        return str(date_value)[:7] if str(date_value) else "Unknown"


@analytics_bp.route("/overview", methods=["GET"])
@require_auth
@require_roles("ADMIN", "DOCTOR", "NURSE", "PHARMACIST")
def overview():
    db = get_db()
    
    total_patients = db["patients"].count_documents({})
    total_encounters = db["encounters"].count_documents({})
    total_vitals = db["vital_signs"].count_documents({})
    total_labs = db["lab_reports"].count_documents({})
    total_conditions = db["conditions"].count_documents({})
    total_medications = db["medications"].count_documents({})
    total_allergies = db["allergies"].count_documents({})
    total_appointments = db["appointments"].count_documents({})

    users = list(db["users"].find({}))
    doctors = sum(1 for u in users if u.get("role") == "DOCTOR")
    nurses = sum(1 for u in users if u.get("role") == "NURSE")
    pharmacists = sum(1 for u in users if u.get("role") == "PHARMACIST")

    safety_alerts = list(db["safety_alerts"].find({}))
    medical_errors = list(db["medical_errors"].find({}))

    active_alerts = sum(1 for alert in safety_alerts if alert.get("status") != "resolved")
    critical_alerts = sum(1 for alert in safety_alerts if str(alert.get("severity", "")).upper() == "CRITICAL")
    error_count = len(medical_errors)

    # Gender distribution from patients
    patients = list(db["patients"].find({}, {"gender": 1}))
    gender_counts = Counter(p.get("gender", "Other") for p in patients)

    # Encounters by class
    encounters = list(db["encounters"].find({}, {"encounter_class": 1, "date": 1, "created_at": 1}))
    class_counts = Counter(e.get("encounter_class", "ambulatory") for e in encounters)
    
    # Encounters over time (monthly top 6)
    time_counts = Counter(month_bucket(e.get("created_at") or e.get("date")) for e in encounters)
    sorted_time = [{"name": k, "value": v} for k, v in sorted(time_counts.items()) if k != "Unknown"][-10:]

    # Conditions top 6
    conditions = list(db["conditions"].find({}, {"description": 1}))
    top_conditions = [{"name": k[:30], "value": v} for k, v in Counter(c.get("description", "Unknown") for c in conditions).most_common(6)]

    return jsonify({
        "success": True,
        "summary": {
            "total_patients": total_patients,
            "total_encounters": total_encounters,
            "total_vitals": total_vitals,
            "total_labs": total_labs,
            "total_conditions": total_conditions,
            "total_medications": total_medications,
            "total_allergies": total_allergies,
            "total_appointments": total_appointments,
            "total_doctors": doctors,
            "total_nurses": nurses,
            "total_pharmacists": pharmacists,
            "active_safety_alerts": active_alerts,
            "critical_alerts": critical_alerts,
            "medical_errors_detected": error_count,
        },
        "charts": {
            "gender_distribution": [
                {"name": name, "value": value} for name, value in gender_counts.items()
            ],
            "encounter_types": [
                {"name": name.capitalize(), "value": value} for name, value in class_counts.items()
            ],
            "encounters_over_time": sorted_time,
            "top_conditions": top_conditions,
            "user_activity": [
                {"name": u.get("role", "UNKNOWN"), "value": 1} for u in users
            ],
        },
    })


@analytics_bp.route("/errors", methods=["GET"])
@require_auth
@require_roles("ADMIN", "DOCTOR", "NURSE", "PHARMACIST")
def error_trends():
    db = get_db()
    encounters = list(db["encounters"].find({}, {"date": 1, "created_at": 1}))
    series = [
        {"name": bucket, "value": count}
        for bucket, count in sorted(Counter(month_bucket(item.get("created_at") or item.get("date")) for item in encounters).items())
        if bucket != "Unknown"
    ][-12:]
    return jsonify({"success": True, "data": series})


@analytics_bp.route("/alerts", methods=["GET"])
@require_auth
@require_roles("ADMIN", "DOCTOR", "NURSE", "PHARMACIST")
def alert_distribution():
    db = get_db()
    allergies = list(db["allergies"].find({}, {"description": 1}))
    series = [
        {"name": desc[:25], "value": count}
        for desc, count in Counter(a.get("description", "Unknown") for a in allergies).most_common(6)
    ]
    return jsonify({"success": True, "data": series})
