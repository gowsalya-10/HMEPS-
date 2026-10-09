from flask import Blueprint, jsonify, request
from bson.objectid import ObjectId
from db import get_db
from datetime import datetime
from app.middleware.auth import require_auth, require_roles

bp = Blueprint('api', __name__)

def parse_json(data):
    import json
    from bson import json_util
    return json.loads(json_util.dumps(data))

# ==========================================
# PATIENTS
# ==========================================
@bp.route('/patients', methods=['GET'])
@require_auth
@require_roles('admin', 'doctor', 'nurse', 'pharmacist')
def get_patients():
    db = get_db()
    
    # Optional search params
    search_query = request.args.get('search', '')
    query = {}
    if search_query:
        query = {
            "$or": [
                {"patient_id": {"$regex": search_query, "$options": "i"}},
                {"synthea_id": {"$regex": search_query, "$options": "i"}},
                {"full_name": {"$regex": search_query, "$options": "i"}},
                {"phone": {"$regex": search_query, "$options": "i"}}
            ]
        }
        
    patients = list(db.patients.find(query))
    return jsonify(parse_json(patients)), 200

@bp.route('/patients', methods=['POST'])
@require_auth
@require_roles('admin', 'doctor', 'nurse')
def create_patient():
    db = get_db()
    data = request.json or {}
    
    if data.get("patient_id") and db.patients.find_one({"patient_id": data.get("patient_id")}):
        return jsonify({"error": "Patient ID already exists"}), 400
        
    data['created_at'] = datetime.utcnow().isoformat()
    result = db.patients.insert_one(data)
    
    new_patient = db.patients.find_one({"_id": result.inserted_id})
    return jsonify(parse_json(new_patient)), 201

@bp.route('/patients/<id>', methods=['GET'])
@require_auth
@require_roles('admin', 'doctor', 'nurse', 'pharmacist')
def get_patient(id):
    db = get_db()
    patient = None
    if ObjectId.is_valid(id):
        patient = db.patients.find_one({"_id": ObjectId(id)})
    if not patient:
        patient = db.patients.find_one({"$or": [{"patient_id": id}, {"synthea_id": id}, {"_id": id}]})
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify(parse_json(patient)), 200

@bp.route('/patients/<id>', methods=['PUT'])
@require_auth
@require_roles('admin', 'doctor', 'nurse')
def update_patient(id):
    db = get_db()
    data = request.json or {}
    
    if "_id" in data:
        del data["_id"]
        
    filter_query = {"_id": ObjectId(id)} if ObjectId.is_valid(id) else {"$or": [{"patient_id": id}, {"synthea_id": id}]}
    result = db.patients.update_one(filter_query, {"$set": data})
    if result.matched_count == 0:
        return jsonify({"error": "Patient not found"}), 404
        
    updated_patient = db.patients.find_one(filter_query)
    return jsonify(parse_json(updated_patient)), 200

@bp.route('/patients/<id>', methods=['DELETE'])
@require_auth
@require_roles('admin', 'doctor')
def delete_patient(id):
    db = get_db()
    filter_query = {"_id": ObjectId(id)} if ObjectId.is_valid(id) else {"$or": [{"patient_id": id}, {"synthea_id": id}]}
    result = db.patients.delete_one(filter_query)
    if result.deleted_count == 0:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify({"message": "Patient deleted successfully"}), 200

# ==========================================
# ELECTRONIC HEALTH RECORDS
# ==========================================
@bp.route('/patients/<id>/records', methods=['GET'])
@require_auth
@require_roles('admin', 'doctor', 'nurse')
def get_records(id):
    db = get_db()
    records = list(db.medical_records.find({
        "$or": [
            {"patient_objectId": str(id)},
            {"patient_id": str(id)},
            {"patient_synthea_id": str(id)}
        ]
    }).sort("created_at", -1))
    return jsonify(parse_json(records)), 200

@bp.route('/patients/<id>/records', methods=['POST'])
@require_auth
@require_roles('admin', 'doctor', 'nurse')
def create_record(id):
    db = get_db()
    data = request.json or {}
    data['patient_objectId'] = str(id)
    if 'created_at' not in data:
        data['created_at'] = datetime.utcnow().isoformat()
        
    result = db.medical_records.insert_one(data)
    new_record = db.medical_records.find_one({"_id": result.inserted_id})
    return jsonify(parse_json(new_record)), 201

# ==========================================
# VITAL SIGNS
# ==========================================
@bp.route('/patients/<id>/vitals', methods=['GET'])
@require_auth
@require_roles('admin', 'doctor', 'nurse')
def get_vitals(id):
    db = get_db()
    vitals = list(db.vital_signs.find({
        "$or": [
            {"patient_objectId": str(id)},
            {"patient_id": str(id)},
            {"patient_synthea_id": str(id)}
        ]
    }).sort("date", -1))
    return jsonify(parse_json(vitals)), 200

@bp.route('/patients/<id>/vitals', methods=['POST'])
@require_auth
@require_roles('admin', 'doctor', 'nurse')
def create_vital(id):
    db = get_db()
    data = request.json or {}
    data['patient_objectId'] = str(id)
    if 'date' not in data:
        data['date'] = datetime.utcnow().isoformat()
        
    result = db.vital_signs.insert_one(data)
    new_vital = db.vital_signs.find_one({"_id": result.inserted_id})
    return jsonify(parse_json(new_vital)), 201

# ==========================================
# LAB REPORTS
# ==========================================
@bp.route('/patients/<id>/labs', methods=['GET'])
@require_auth
@require_roles('admin', 'doctor')
def get_labs(id):
    db = get_db()
    labs = list(db.lab_reports.find({
        "$or": [
            {"patient_objectId": str(id)},
            {"patient_id": str(id)},
            {"patient_synthea_id": str(id)}
        ]
    }).sort("date", -1))
    return jsonify(parse_json(labs)), 200

@bp.route('/patients/<id>/labs', methods=['POST'])
@require_auth
@require_roles('admin', 'doctor')
def create_lab(id):
    db = get_db()
    data = request.json or {}
    data['patient_objectId'] = str(id)
    if 'date' not in data:
        data['date'] = datetime.utcnow().isoformat()
        
    result = db.lab_reports.insert_one(data)
    new_lab = db.lab_reports.find_one({"_id": result.inserted_id})
    return jsonify(parse_json(new_lab)), 201

# ==========================================
# APPOINTMENTS
# ==========================================
@bp.route('/appointments', methods=['GET'])
@require_auth
@require_roles('admin', 'doctor', 'nurse')
def get_appointments():
    db = get_db()
    appointments = list(db.appointments.find().sort("date", 1))
    return jsonify(parse_json(appointments)), 200

@bp.route('/appointments', methods=['POST'])
@require_auth
@require_roles('admin', 'doctor', 'nurse')
def create_appointment():
    db = get_db()
    data = request.json or {}
    data['created_at'] = datetime.utcnow().isoformat()
    
    result = db.appointments.insert_one(data)
    new_appointment = db.appointments.find_one({"_id": result.inserted_id})
    return jsonify(parse_json(new_appointment)), 201

@bp.route('/appointments/<id>', methods=['PUT'])
@require_auth
@require_roles('admin', 'doctor', 'nurse')
def update_appointment(id):
    db = get_db()
    data = request.json or {}
    
    if "_id" in data:
        del data["_id"]
        
    filter_query = {"_id": ObjectId(id)} if ObjectId.is_valid(id) else {"appointment_id": id}
    result = db.appointments.update_one(filter_query, {"$set": data})
    if result.matched_count == 0:
        return jsonify({"error": "Appointment not found"}), 404
        
    updated_appointment = db.appointments.find_one(filter_query)
    return jsonify(parse_json(updated_appointment)), 200

@bp.route('/appointments/<id>', methods=['DELETE'])
@require_auth
@require_roles('admin', 'doctor')
def delete_appointment(id):
    db = get_db()
    filter_query = {"_id": ObjectId(id)} if ObjectId.is_valid(id) else {"appointment_id": id}
    result = db.appointments.delete_one(filter_query)
    if result.deleted_count == 0:
        return jsonify({"error": "Appointment not found"}), 404
    return jsonify({"message": "Appointment deleted successfully"}), 200
