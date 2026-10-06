from datetime import datetime
from flask import Blueprint, request, jsonify, g
from prescription_safety.database import get_db
from prescription_safety.middleware.auth import jwt_required, role_required
from prescription_safety.services.audit_service import AuditService

alert_bp = Blueprint("alerts", __name__)

@alert_bp.route("", methods=["GET"])
@jwt_required
def get_alerts():
    db = get_db()
    severity = request.args.get("severity", "").strip()
    status = request.args.get("status", "").strip()
    alert_type = request.args.get("alert_type", "").strip()
    patient_id = request.args.get("patient_id", "").strip()

    query = {}
    if severity:
        query["severity"] = severity
    if status:
        query["status"] = status
    if alert_type:
        query["alert_type"] = alert_type
    if patient_id:
        query["patient_id"] = patient_id

    alerts = list(db.safety_alerts.find(query, sort=[("created_at", -1)]))
    for a in alerts:
        a["_id"] = str(a["_id"])

    # Count statistics by status and severity
    all_alerts = list(db.safety_alerts.find({}))
    stats = {
        "total": len(all_alerts),
        "open": len([a for a in all_alerts if a.get("status") == "open"]),
        "acknowledged": len([a for a in all_alerts if a.get("status") == "acknowledged"]),
        "resolved": len([a for a in all_alerts if a.get("status") == "resolved"]),
        "critical": len([a for a in all_alerts if a.get("severity") == "CRITICAL" and a.get("status") != "resolved"]),
        "high": len([a for a in all_alerts if a.get("severity") == "HIGH" and a.get("status") != "resolved"])
    }

    return jsonify({
        "alerts": alerts,
        "count": len(alerts),
        "stats": stats
    })

@alert_bp.route("/<alert_id>", methods=["GET"])
@jwt_required
def get_alert_details(alert_id):
    db = get_db()
    alert = db.safety_alerts.find_one({"_id": alert_id})

    if not alert:
        return jsonify({"error": "Safety alert not found"}), 404

    alert["_id"] = str(alert["_id"])

    # Fetch patient details
    patient = db.patients.find_one({"patient_id": alert["patient_id"]})
    if patient:
        patient["_id"] = str(patient["_id"])

    # Fetch prescription details if attached
    prescription = None
    if alert.get("prescription_id"):
        prescription = db.prescriptions.find_one({"_id": alert["prescription_id"]})
        if prescription:
            prescription["_id"] = str(prescription["_id"])

    return jsonify({
        "alert": alert,
        "patient": patient,
        "prescription": prescription
    })

@alert_bp.route("/<alert_id>/acknowledge", methods=["POST"])
@jwt_required
@role_required(["doctor", "pharmacist", "nurse", "admin"])
def acknowledge_alert(alert_id):
    db = get_db()
    alert = db.safety_alerts.find_one({"_id": alert_id})

    if not alert:
        return jsonify({"error": "Safety alert not found"}), 404

    if alert.get("status") == "resolved":
        return jsonify({"error": "Cannot acknowledge an already resolved alert"}), 400

    now_iso = datetime.utcnow().isoformat()
    user_name = g.current_user.get("name", "Staff Member")

    db.safety_alerts.update_one(
        {"_id": alert_id},
        {
            "$set": {
                "status": "acknowledged",
                "acknowledged_at": now_iso,
                "acknowledged_by": user_name,
                "acknowledged_by_id": g.current_user.get("user_id")
            }
        }
    )

    AuditService.log_event(
        "SAFETY_ALERT_ACKNOWLEDGED",
        g.current_user,
        "safety_alert",
        alert_id,
        {"alert_type": alert.get("alert_type"), "severity": alert.get("severity")}
    )

    return jsonify({
        "message": "Safety alert acknowledged successfully",
        "alert_id": alert_id,
        "status": "acknowledged",
        "acknowledged_by": user_name,
        "acknowledged_at": now_iso
    })

@alert_bp.route("/<alert_id>/resolve", methods=["POST"])
@jwt_required
@role_required(["doctor", "pharmacist", "admin"])
def resolve_alert(alert_id):
    data = request.get_json() or {}
    resolution_note = data.get("resolution_note", "").strip()

    if not resolution_note:
        return jsonify({"error": "A valid clinical resolution note is required to resolve a safety alert"}), 400

    db = get_db()
    alert = db.safety_alerts.find_one({"_id": alert_id})

    if not alert:
        return jsonify({"error": "Safety alert not found"}), 404

    now_iso = datetime.utcnow().isoformat()
    user_name = g.current_user.get("name", "Staff Member")

    db.safety_alerts.update_one(
        {"_id": alert_id},
        {
            "$set": {
                "status": "resolved",
                "resolved_at": now_iso,
                "resolved_by": user_name,
                "resolved_by_id": g.current_user.get("user_id"),
                "resolution_note": resolution_note
            }
        }
    )

    AuditService.log_event(
        "SAFETY_ALERT_RESOLVED",
        g.current_user,
        "safety_alert",
        alert_id,
        {
            "alert_type": alert.get("alert_type"),
            "severity": alert.get("severity"),
            "resolution_note": resolution_note
        }
    )

    return jsonify({
        "message": "Safety alert resolved successfully",
        "alert_id": alert_id,
        "status": "resolved",
        "resolved_by": user_name,
        "resolved_at": now_iso,
        "resolution_note": resolution_note
    })

