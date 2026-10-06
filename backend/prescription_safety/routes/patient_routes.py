from datetime import datetime
from flask import Blueprint, request, jsonify, g
from prescription_safety.database import get_db
from prescription_safety.middleware.auth import jwt_required, role_required
from prescription_safety.services.audit_service import AuditService

patient_bp = Blueprint("patients", __name__)

@patient_bp.route("", methods=["GET"])
@jwt_required
def get_patients():
    db = get_db()
    search = request.args.get("search", "").strip()

    query = {}
    if search:
        query = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"patient_id": {"$regex": search, "$options": "i"}},
                {"mrn": {"$regex": search, "$options": "i"}}
            ]
        }

    patients = list(db.patients.find(query))
    for p in patients:
        p["_id"] = str(p["_id"])

    return jsonify({"patients": patients, "count": len(patients)})

@patient_bp.route("/<patient_id>", methods=["GET"])
@jwt_required
def get_patient_details(patient_id):
    db = get_db()
    patient = db.patients.find_one({"patient_id": patient_id}) or db.patients.find_one({"_id": patient_id})

    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    patient["_id"] = str(patient["_id"])

    # Include active prescriptions list
    active_prescriptions = list(db.prescriptions.find({"patient_id": patient["patient_id"], "status": "active"}))
    for p in active_prescriptions:
        p["_id"] = str(p["_id"])

    patient["active_prescriptions"] = active_prescriptions

    return jsonify({"patient": patient})

@patient_bp.route("", methods=["POST"])
@jwt_required
@role_required(["doctor", "admin"])
def create_patient():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    patient_id = data.get("patient_id", "").strip()
    dob = data.get("dob", "").strip()
    gender = data.get("gender", "").strip()

    if not name or not patient_id or not dob:
        return jsonify({"error": "Name, patient_id, and dob are required"}), 400

    db = get_db()
    if db.patients.find_one({"patient_id": patient_id}):
        return jsonify({"error": "Patient with this ID already exists"}), 400

    doc = {
        "patient_id": patient_id,
        "name": name,
        "dob": dob,
        "gender": gender or "unspecified",
        "allergies": data.get("allergies", []),
        "medical_conditions": data.get("medical_conditions", []),
        "blood_type": data.get("blood_type", "Unknown"),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    res = db.patients.insert_one(doc)
    doc["_id"] = str(res.inserted_id)

    AuditService.log_event("PATIENT_CREATED", g.current_user, "patient", patient_id, {"name": name})

    return jsonify({"message": "Patient created successfully", "patient": doc}), 201

@patient_bp.route("/<patient_id>/allergies", methods=["POST"])
@jwt_required
@role_required(["doctor", "nurse", "admin"])
def update_patient_allergies(patient_id):
    data = request.get_json() or {}
    new_allergy = data.get("allergy", "").strip()

    if not new_allergy:
        return jsonify({"error": "Allergy description required"}), 400

    db = get_db()
    patient = db.patients.find_one({"patient_id": patient_id})
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    allergies = patient.get("allergies", [])
    if new_allergy not in allergies:
        allergies.append(new_allergy)
        db.patients.update_one(
            {"patient_id": patient_id},
            {"$set": {"allergies": allergies, "updated_at": datetime.utcnow().isoformat()}}
        )

    return jsonify({"message": "Allergy updated successfully", "allergies": allergies})

