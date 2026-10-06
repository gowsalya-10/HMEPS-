from datetime import datetime
from flask import Blueprint, request, jsonify, g
from prescription_safety.database import get_db
from prescription_safety.middleware.auth import jwt_required, role_required
from prescription_safety.services.safety_service import SafetyService
from prescription_safety.services.audit_service import AuditService
from prescription_safety.services.notification_service import NotificationService

prescription_bp = Blueprint("prescriptions", __name__)

@prescription_bp.route("/safety-check", methods=["POST"])
@jwt_required
def run_safety_check():
    data = request.get_json() or {}
    patient_id = data.get("patient_id", "").strip()

    if not patient_id:
        return jsonify({"error": "patient_id is required"}), 400

    db = get_db()
    patient = db.patients.find_one({"patient_id": patient_id}) or db.patients.find_one({"_id": patient_id})
    if not patient:
        return jsonify({"error": f"Patient with ID '{patient_id}' not found in EHR database"}), 404

    report = SafetyService.run_all_checks(data, patient["patient_id"])
    return jsonify({"safety_report": report})

@prescription_bp.route("", methods=["POST"])
@jwt_required
@role_required(["doctor", "admin"])
def create_prescription():
    data = request.get_json() or {}
    patient_id = data.get("patient_id", "").strip()
    medication_name = data.get("medication_name", "").strip()
    dosage = data.get("dosage", "").strip()
    route = data.get("route", "").strip()
    frequency = data.get("frequency", "").strip()
    duration = data.get("duration", "").strip()
    notes = data.get("notes", "").strip()
    override_reason = data.get("override_reason", "").strip()

    if not patient_id or not medication_name or not dosage or not route or not frequency or not duration:
        return jsonify({"error": "Missing required fields: patient_id, medication_name, dosage, route, frequency, duration"}), 400

    db = get_db()
    patient = db.patients.find_one({"patient_id": patient_id}) or db.patients.find_one({"_id": patient_id})
    if not patient:
        return jsonify({"error": f"Patient with ID '{patient_id}' does not exist in EHR Module 1"}), 404

    # Run safety checks
    safety_report = SafetyService.run_all_checks(data, patient["patient_id"])

    # If critical risk and no override reason provided, require explicit clinician override confirmation
    if safety_report["overall_status"] == "CRITICAL_RISK" and not override_reason:
        return jsonify({
            "error": "CRITICAL medication safety risk detected. Overriding requires explicit clinical justification.",
            "requires_override": True,
            "safety_report": safety_report
        }), 422

    now_iso = datetime.utcnow().isoformat()
    prescribing_clinician = g.current_user.get("name", "Dr. Clinician")

    prescription_doc = {
        "patient_id": patient["patient_id"],
        "patient_name": patient.get("name", "Unknown Patient"),
        "medication_name": medication_name,
        "dosage": dosage,
        "route": route,
        "frequency": frequency,
        "duration": duration,
        "notes": notes,
        "prescribing_clinician": prescribing_clinician,
        "prescriber_id": g.current_user.get("user_id"),
        "prescription_date": now_iso,
        "status": "active",
        "override_reason": override_reason if override_reason else None,
        "safety_report": safety_report,
        "created_at": now_iso,
        "updated_at": now_iso
    }

    res = db.prescriptions.insert_one(prescription_doc)
    prescription_id = str(res.inserted_id)
    prescription_doc["_id"] = prescription_id

    # Create safety alerts if any HIGH or CRITICAL checks triggered
    created_alerts = []
    for check in safety_report["checks"]:
        if check["severity"] in ["HIGH", "CRITICAL"] and check["outcome"] == "FAIL":
            alert_doc = {
                "patient_id": patient["patient_id"],
                "patient_name": patient.get("name"),
                "prescription_id": prescription_id,
                "medication_name": medication_name,
                "alert_type": check["check_type"],
                "severity": check["severity"],
                "description": check["title"],
                "reason": check["reason"],
                "status": "open",
                "created_at": now_iso,
                "acknowledged_at": None,
                "acknowledged_by": None,
                "resolved_at": None,
                "resolved_by": None,
                "resolution_note": None
            }
            alert_res = db.safety_alerts.insert_one(alert_doc)
            alert_doc["_id"] = str(alert_res.inserted_id)
            created_alerts.append(alert_doc)

            # Module 3 integration call
            NotificationService.send_alert_notification(alert_doc)

    AuditService.log_event(
        "PRESCRIPTION_CREATED",
        g.current_user,
        "prescription",
        prescription_id,
        {
            "patient_id": patient["patient_id"],
            "medication_name": medication_name,
            "overall_safety_status": safety_report["overall_status"],
            "alerts_generated": len(created_alerts)
        }
    )

    return jsonify({
        "message": "Prescription created successfully",
        "prescription": prescription_doc,
        "alerts_generated": created_alerts
    }), 201

@prescription_bp.route("", methods=["GET"])
@jwt_required
def get_prescriptions():
    db = get_db()
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip()
    patient_id = request.args.get("patient_id", "").strip()
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    skip = (page - 1) * limit

    query = {}
    if status:
        query["status"] = status
    if patient_id:
        query["patient_id"] = patient_id
    if search:
        query["$or"] = [
            {"medication_name": {"$regex": search, "$options": "i"}},
            {"patient_name": {"$regex": search, "$options": "i"}},
            {"patient_id": {"$regex": search, "$options": "i"}},
            {"prescribing_clinician": {"$regex": search, "$options": "i"}}
        ]

    total = db.prescriptions.count_documents(query)
    prescriptions = db.prescriptions.find(query, sort=[("created_at", -1)], skip=skip, limit=limit)
    
    result = []
    for p in prescriptions:
        p["_id"] = str(p["_id"])
        result.append(p)

    return jsonify({
        "prescriptions": result,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit else 1
    })

@prescription_bp.route("/<prescription_id>", methods=["GET"])
@jwt_required
def get_prescription_details(prescription_id):
    db = get_db()
    p = db.prescriptions.find_one({"_id": prescription_id})

    if not p:
        return jsonify({"error": "Prescription not found"}), 404

    p["_id"] = str(p["_id"])
    
    # Fetch patient details from Module 1
    patient = db.patients.find_one({"patient_id": p["patient_id"]})
    if patient:
        patient["_id"] = str(patient["_id"])

    # Fetch associated safety alerts
    alerts = list(db.safety_alerts.find({"prescription_id": prescription_id}))
    for a in alerts:
        a["_id"] = str(a["_id"])

    return jsonify({
        "prescription": p,
        "patient": patient,
        "alerts": alerts
    })

@prescription_bp.route("/<prescription_id>/status", methods=["PATCH"])
@jwt_required
@role_required(["doctor", "pharmacist", "admin"])
def update_prescription_status(prescription_id):
    data = request.get_json() or {}
    new_status = data.get("status", "").strip().lower()
    reason = data.get("reason", "").strip()

    if new_status not in ["active", "discontinued", "completed"]:
        return jsonify({"error": "Status must be 'active', 'discontinued', or 'completed'"}), 400

    db = get_db()
    p = db.prescriptions.find_one({"_id": prescription_id})
    if not p:
        return jsonify({"error": "Prescription not found"}), 404

    old_status = p.get("status")
    now_iso = datetime.utcnow().isoformat()

    update_fields = {
        "status": new_status,
        "updated_at": now_iso
    }
    if new_status == "discontinued":
        update_fields["discontinued_at"] = now_iso
        update_fields["discontinued_by"] = g.current_user.get("name")
        update_fields["discontinue_reason"] = reason

    db.prescriptions.update_one({"_id": prescription_id}, {"$set": update_fields})

    AuditService.log_event(
        "PRESCRIPTION_STATUS_UPDATED",
        g.current_user,
        "prescription",
        prescription_id,
        {"old_status": old_status, "new_status": new_status, "reason": reason}
    )

    return jsonify({
        "message": f"Prescription status updated from {old_status} to {new_status}",
        "prescription_id": prescription_id,
        "status": new_status
    })

@prescription_bp.route("/<prescription_id>", methods=["PUT"])
@jwt_required
@role_required(["doctor", "admin"])
def update_prescription(prescription_id):
    data = request.get_json() or {}
    db = get_db()
    existing = db.prescriptions.find_one({"_id": prescription_id})
    if not existing:
        return jsonify({"error": "Prescription not found"}), 404

    # Merge updated data with existing for safety re-run
    merged_data = {
        "patient_id": existing["patient_id"],
        "medication_name": data.get("medication_name", existing["medication_name"]),
        "dosage": data.get("dosage", existing["dosage"]),
        "route": data.get("route", existing["route"]),
        "frequency": data.get("frequency", existing["frequency"]),
        "duration": data.get("duration", existing["duration"]),
        "notes": data.get("notes", existing.get("notes", ""))
    }

    # Re-run safety checks
    safety_report = SafetyService.run_all_checks(merged_data, existing["patient_id"])
    now_iso = datetime.utcnow().isoformat()

    update_doc = {
        "medication_name": merged_data["medication_name"],
        "dosage": merged_data["dosage"],
        "route": merged_data["route"],
        "frequency": merged_data["frequency"],
        "duration": merged_data["duration"],
        "notes": merged_data["notes"],
        "safety_report": safety_report,
        "updated_at": now_iso
    }

    db.prescriptions.update_one({"_id": prescription_id}, {"$set": update_doc})

    AuditService.log_event(
        "PRESCRIPTION_UPDATED",
        g.current_user,
        "prescription",
        prescription_id,
        {"updated_fields": list(data.keys())}
    )

    return jsonify({"message": "Prescription updated successfully", "safety_report": safety_report})

