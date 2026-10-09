import csv
import os
import glob
import sys
from datetime import datetime, timezone
from pymongo import UpdateOne

# Add parent dir to sys.path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import initialize_database, get_db

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'synthea'))

def parse_date(dt_str):
    if not dt_str:
        return None
    try:
        if 'T' in dt_str:
            return dt_str.split('T')[0]
        return dt_str
    except Exception:
        return dt_str

def get_blood_group(patient_id):
    groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    val = sum(ord(c) for c in patient_id)
    return groups[val % len(groups)]

def run_import():
    print("Initializing database connection...")
    initialize_database()
    db = get_db()

    if not os.path.exists(DATA_DIR):
        print(f"Error: Synthea data directory not found at {DATA_DIR}")
        return

    collections = ['patients', 'encounters', 'appointments', 'vital_signs', 'lab_reports', 'conditions', 'medications', 'allergies']
    
    # 1. PATIENTS
    patients_file = os.path.join(DATA_DIR, 'patients.csv')
    patient_id_map = {} # synthea_id -> patient_id
    patient_ops = []
    if os.path.exists(patients_file):
        print("Processing Patients...")
        with open(patients_file, mode='r', encoding='utf-8', errors='ignore') as fp:
            reader = csv.DictReader(fp)
            for idx, row in enumerate(reader):
                synthea_id = row['Id']
                patient_id = f"PT-{(idx+1):04d}"
                patient_id_map[synthea_id] = patient_id

                gender = 'Male' if row.get('GENDER') == 'M' else 'Female' if row.get('GENDER') == 'F' else row.get('GENDER', 'Other')
                full_name = f"{row.get('FIRST', '')} {row.get('LAST', '')}".strip()
                address = f"{row.get('ADDRESS', '')}, {row.get('CITY', '')}, {row.get('STATE', '')} {row.get('ZIP', '')}".strip(', ')
                email = f"{row.get('FIRST', 'patient').lower()}.{row.get('LAST', 'user').lower()}@example.com"
                phone = f"(555) {(idx+100):03d}-{(idx*37 % 10000):04d}"

                doc = {
                    "patient_id": patient_id,
                    "synthea_id": synthea_id,
                    "full_name": full_name or "Unknown Patient",
                    "dob": parse_date(row.get('BIRTHDATE')),
                    "gender": gender,
                    "phone": phone,
                    "email": email,
                    "address": address,
                    "blood_group": get_blood_group(synthea_id),
                    "marital": row.get('MARITAL', ''),
                    "race": row.get('RACE', ''),
                    "ethnicity": row.get('ETHNICITY', ''),
                    "known_allergies": [],
                    "existing_conditions": [],
                    "created_at": datetime.now(timezone.utc).isoformat()
                }

                patient_ops.append(UpdateOne({"synthea_id": synthea_id}, {"$set": doc}, upsert=True))

        if patient_ops:
            res = db["patients"].bulk_write(patient_ops, ordered=False)
            print(f"Patients bulk_write: {res.upserted_count} inserted, {res.modified_count} updated, {res.matched_count} matched")

    # 2. ALLERGIES
    allergies_file = os.path.join(DATA_DIR, 'allergies.csv')
    patient_allergies = {}
    allergy_ops = []
    if os.path.exists(allergies_file):
        print("Processing Allergies...")
        with open(allergies_file, mode='r', encoding='utf-8', errors='ignore') as fp:
            reader = csv.DictReader(fp)
            for row in reader:
                pid = row.get('PATIENT')
                desc = row.get('DESCRIPTION')
                if pid and desc:
                    patient_allergies.setdefault(pid, set()).add(desc)
                    doc = {
                        "patient_synthea_id": pid,
                        "patient_id": patient_id_map.get(pid, pid),
                        "code": row.get('CODE'),
                        "description": desc,
                        "start": parse_date(row.get('START')),
                        "stop": parse_date(row.get('STOP')),
                        "reaction": row.get('REACTION1', '')
                    }
                    allergy_ops.append(UpdateOne(
                        {"patient_synthea_id": pid, "code": row.get('CODE')},
                        {"$set": doc},
                        upsert=True
                    ))
        if allergy_ops:
            res = db["allergies"].bulk_write(allergy_ops, ordered=False)
            print(f"Allergies bulk_write: {res.upserted_count} inserted, {res.modified_count} updated, {res.matched_count} matched")

    # 3. CONDITIONS
    conditions_file = os.path.join(DATA_DIR, 'conditions.csv')
    patient_conditions = {}
    condition_ops = []
    if os.path.exists(conditions_file):
        print("Processing Conditions...")
        with open(conditions_file, mode='r', encoding='utf-8', errors='ignore') as fp:
            reader = csv.DictReader(fp)
            for row in reader:
                pid = row.get('PATIENT')
                desc = row.get('DESCRIPTION')
                if pid and desc:
                    patient_conditions.setdefault(pid, set()).add(desc)
                    doc = {
                        "patient_synthea_id": pid,
                        "patient_id": patient_id_map.get(pid, pid),
                        "encounter_id": row.get('ENCOUNTER'),
                        "code": row.get('CODE'),
                        "description": desc,
                        "start": parse_date(row.get('START')),
                        "stop": parse_date(row.get('STOP'))
                    }
                    condition_ops.append(UpdateOne(
                        {"patient_synthea_id": pid, "code": row.get('CODE'), "start": parse_date(row.get('START'))},
                        {"$set": doc},
                        upsert=True
                    ))
        if condition_ops:
            res = db["conditions"].bulk_write(condition_ops, ordered=False)
            print(f"Conditions bulk_write: {res.upserted_count} inserted, {res.modified_count} updated, {res.matched_count} matched")

    # Update patient allergy & condition arrays
    p_update_ops = []
    for pid, p_allergies in patient_allergies.items():
        p_update_ops.append(UpdateOne({"synthea_id": pid}, {"$set": {"known_allergies": list(p_allergies)}}))
    for pid, p_conds in patient_conditions.items():
        p_update_ops.append(UpdateOne({"synthea_id": pid}, {"$set": {"existing_conditions": list(p_conds)}}))
    if p_update_ops:
        db["patients"].bulk_write(p_update_ops, ordered=False)

    # 4. ENCOUNTERS & APPOINTMENTS
    encounters_file = os.path.join(DATA_DIR, 'encounters.csv')
    encounter_ops = []
    appointment_ops = []
    if os.path.exists(encounters_file):
        print("Processing Encounters & Appointments...")
        with open(encounters_file, mode='r', encoding='utf-8', errors='ignore') as fp:
            reader = csv.DictReader(fp)
            for row in reader:
                enc_id = row['Id']
                pid = row.get('PATIENT')
                start_dt = row.get('START', '')
                date_part = parse_date(start_dt)
                time_part = start_dt.split('T')[1][:5] if 'T' in start_dt else '09:00'
                reason = row.get('REASONDESCRIPTION') or row.get('DESCRIPTION') or 'General Examination'

                doc = {
                    "encounter_id": enc_id,
                    "appointment_id": f"APT-{enc_id[:8]}",
                    "patient_synthea_id": pid,
                    "patient_id": patient_id_map.get(pid, pid),
                    "doctor_id": row.get('PROVIDER', 'DOC-DEFAULT'),
                    "date": date_part,
                    "time": time_part,
                    "reason": reason,
                    "encounter_class": row.get('ENCOUNTERCLASS', 'ambulatory'),
                    "status": "Completed" if row.get('STOP') else "Scheduled",
                    "created_at": start_dt
                }
                encounter_ops.append(UpdateOne({"encounter_id": enc_id}, {"$set": doc}, upsert=True))
                appointment_ops.append(UpdateOne({"encounter_id": enc_id}, {"$set": doc}, upsert=True))

        if encounter_ops:
            res_e = db["encounters"].bulk_write(encounter_ops, ordered=False)
            res_a = db["appointments"].bulk_write(appointment_ops, ordered=False)
            print(f"Encounters bulk_write: {res_e.upserted_count} inserted, {res_e.modified_count} updated, {res_e.matched_count} matched")
            print(f"Appointments bulk_write: {res_a.upserted_count} inserted, {res_a.modified_count} updated, {res_a.matched_count} matched")

    # 5. OBSERVATIONS (VITALS & LABS)
    observations_file = os.path.join(DATA_DIR, 'observations.csv')
    vital_ops = []
    lab_ops = []
    if os.path.exists(observations_file):
        print("Processing Observations (Vitals & Labs)...")
        with open(observations_file, mode='r', encoding='utf-8', errors='ignore') as fp:
            reader = csv.DictReader(fp)
            for row in reader:
                cat = row.get('CATEGORY', '').lower()
                pid = row.get('PATIENT')
                obs_date = parse_date(row.get('DATE'))
                desc = row.get('DESCRIPTION', '')
                val = row.get('VALUE', '')
                unit = row.get('UNITS', '')
                p_id = patient_id_map.get(pid, pid)

                if cat == 'vital-signs' or any(kw in desc.lower() for kw in ['body weight', 'body height', 'blood pressure', 'heart rate', 'respiratory rate', 'body temperature', 'oxygen saturation']):
                    obs_id = f"{pid}_{row.get('CODE')}_{obs_date}"
                    v_doc = {
                        "obs_id": obs_id,
                        "patient_synthea_id": pid,
                        "patient_id": p_id,
                        "patient_objectId": p_id,
                        "date": obs_date,
                        "type": desc,
                        "value": val,
                        "unit": unit,
                        "created_at": row.get('DATE')
                    }
                    vital_ops.append(UpdateOne({"obs_id": obs_id}, {"$set": v_doc}, upsert=True))
                else:
                    lab_id = f"{pid}_{row.get('CODE')}_{obs_date}"
                    lab_doc = {
                        "lab_id": lab_id,
                        "patient_synthea_id": pid,
                        "patient_id": p_id,
                        "patient_objectId": p_id,
                        "test_name": desc,
                        "result": f"{val} {unit}".strip(),
                        "reference_range": "Normal",
                        "status": "Completed",
                        "doctor_notes": f"Observed code {row.get('CODE')}",
                        "date": obs_date,
                        "category": cat or 'laboratory'
                    }
                    lab_ops.append(UpdateOne({"lab_id": lab_id}, {"$set": lab_doc}, upsert=True))

        if vital_ops:
            # Batch bulk writes in chunks of 5000 for speed
            for i in range(0, len(vital_ops), 5000):
                db["vital_signs"].bulk_write(vital_ops[i:i+5000], ordered=False)
            print(f"Vital signs bulk_write completed: {len(vital_ops)} total records processed.")

        if lab_ops:
            for i in range(0, len(lab_ops), 5000):
                db["lab_reports"].bulk_write(lab_ops[i:i+5000], ordered=False)
            print(f"Lab reports bulk_write completed: {len(lab_ops)} total records processed.")

    # 6. MEDICATIONS
    medications_file = os.path.join(DATA_DIR, 'medications.csv')
    med_ops = []
    if os.path.exists(medications_file):
        print("Processing Medications...")
        with open(medications_file, mode='r', encoding='utf-8', errors='ignore') as fp:
            reader = csv.DictReader(fp)
            for row in reader:
                pid = row.get('PATIENT')
                doc = {
                    "patient_synthea_id": pid,
                    "patient_id": patient_id_map.get(pid, pid),
                    "code": row.get('CODE'),
                    "description": row.get('DESCRIPTION'),
                    "reason": row.get('REASONDESCRIPTION', ''),
                    "start": parse_date(row.get('START')),
                    "stop": parse_date(row.get('STOP'))
                }
                med_ops.append(UpdateOne(
                    {"patient_synthea_id": pid, "code": row.get('CODE'), "start": parse_date(row.get('START'))},
                    {"$set": doc},
                    upsert=True
                ))
        if med_ops:
            res = db["medications"].bulk_write(med_ops, ordered=False)
            print(f"Medications bulk_write: {res.upserted_count} inserted, {res.modified_count} updated, {res.matched_count} matched")

    print("\n================ SYNTHEA BULK IMPORT SUMMARY ================")
    cols = ['patients', 'encounters', 'appointments', 'vital_signs', 'lab_reports', 'conditions', 'medications', 'allergies']
    for c in cols:
        cnt = db[c].count_documents({})
        print(f"  {c:<15}: {cnt} documents in MongoDB")
    print("=============================================================")

if __name__ == '__main__':
    run_import()
