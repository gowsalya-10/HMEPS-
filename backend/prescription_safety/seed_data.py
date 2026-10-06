from datetime import datetime, timedelta
from prescription_safety.database import get_db

def seed_initial_data():
    db = get_db()
    
    # 1. Seed Users
    if db.users.count_documents({}) == 0:
        db.users.insert_one({
            "name": "Dr. Sarah Lin, MD",
            "email": "doctor@hmeps.org",
            "password": "password123",
            "role": "doctor",
            "created_at": datetime.utcnow().isoformat()
        })
        db.users.insert_one({
            "name": "Alex Chen, PharmD",
            "email": "pharmacist@hmeps.org",
            "password": "password123",
            "role": "pharmacist",
            "created_at": datetime.utcnow().isoformat()
        })
        db.users.insert_one({
            "name": "Nurse Brenda Taylor, RN",
            "email": "nurse@hmeps.org",
            "password": "password123",
            "role": "nurse",
            "created_at": datetime.utcnow().isoformat()
        })
        db.users.insert_one({
            "name": "System Administrator",
            "email": "admin@hmeps.org",
            "password": "password123",
            "role": "admin",
            "created_at": datetime.utcnow().isoformat()
        })
        print("Seeded demo users: doctor@hmeps.org, pharmacist@hmeps.org, nurse@hmeps.org, admin@hmeps.org (Password: password123)")

    # 2. Seed Patients (Module 1 Baseline)
    if db.patients.count_documents({}) == 0:
        p1 = {
            "patient_id": "P-1001",
            "mrn": "MRN-884920",
            "name": "Eleanor Vance",
            "dob": "1954-04-12",
            "gender": "Female",
            "blood_type": "A+",
            "allergies": ["Penicillin", "Sulfa"],
            "medical_conditions": ["Atrial Fibrillation", "Hypertension", "Type 2 Diabetes"],
            "created_at": datetime.utcnow().isoformat()
        }
        p2 = {
            "patient_id": "P-1002",
            "mrn": "MRN-330194",
            "name": "Marcus Brody",
            "dob": "1978-09-25",
            "gender": "Male",
            "blood_type": "O-",
            "allergies": ["NSAIDs", "Aspirin"],
            "medical_conditions": ["Chronic Kidney Disease", "Osteoarthritis"],
            "created_at": datetime.utcnow().isoformat()
        }
        p3 = {
            "patient_id": "P-1003",
            "mrn": "MRN-771203",
            "name": "Leo Martinez",
            "dob": "2015-11-03",
            "gender": "Male",
            "blood_type": "B+",
            "allergies": [],
            "medical_conditions": ["Asthma"],
            "created_at": datetime.utcnow().isoformat()
        }
        db.patients.insert_one(p1)
        db.patients.insert_one(p2)
        db.patients.insert_one(p3)
        print("Seeded Module 1 patient EHR baseline (Eleanor Vance, Marcus Brody, Leo Martinez)")

    # 3. Seed Prescriptions (Module 2 Baseline)
    if db.prescriptions.count_documents({}) == 0:
        rx1 = {
            "patient_id": "P-1001",
            "patient_name": "Eleanor Vance",
            "medication_name": "Warfarin",
            "dosage": "5 mg",
            "route": "Oral",
            "frequency": "once daily",
            "duration": "30 days",
            "prescribing_clinician": "Dr. Sarah Lin, MD",
            "prescription_date": (datetime.utcnow() - timedelta(days=5)).isoformat(),
            "status": "active",
            "notes": "Monitor INR closely weekly",
            "created_at": (datetime.utcnow() - timedelta(days=5)).isoformat()
        }
        rx2 = {
            "patient_id": "P-1001",
            "patient_name": "Eleanor Vance",
            "medication_name": "Lisinopril",
            "dosage": "20 mg",
            "route": "Oral",
            "frequency": "once daily",
            "duration": "90 days",
            "prescribing_clinician": "Dr. Sarah Lin, MD",
            "prescription_date": (datetime.utcnow() - timedelta(days=10)).isoformat(),
            "status": "active",
            "notes": "Blood pressure management",
            "created_at": (datetime.utcnow() - timedelta(days=10)).isoformat()
        }
        rx3 = {
            "patient_id": "P-1002",
            "patient_name": "Marcus Brody",
            "medication_name": "Metformin",
            "dosage": "500 mg",
            "route": "Oral",
            "frequency": "twice daily",
            "duration": "60 days",
            "prescribing_clinician": "Dr. Sarah Lin, MD",
            "prescription_date": (datetime.utcnow() - timedelta(days=2)).isoformat(),
            "status": "active",
            "notes": "Take with meals",
            "created_at": (datetime.utcnow() - timedelta(days=2)).isoformat()
        }
        res1 = db.prescriptions.insert_one(rx1)
        res2 = db.prescriptions.insert_one(rx2)
        res3 = db.prescriptions.insert_one(rx3)
        print("Seeded active prescriptions")

        # 4. Seed Safety Alerts (Module 2 Baseline)
        if db.safety_alerts.count_documents({}) == 0:
            db.safety_alerts.insert_one({
                "patient_id": "P-1001",
                "patient_name": "Eleanor Vance",
                "prescription_id": str(res1.inserted_id),
                "medication_name": "Warfarin",
                "alert_type": "DRUG_INTERACTION",
                "severity": "HIGH",
                "description": "Drug Interaction Alert: Warfarin + Aspirin",
                "reason": "High risk of bleeding hemorrhage when combined with over-the-counter antiplatelets.",
                "status": "open",
                "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat()
            })
            db.safety_alerts.insert_one({
                "patient_id": "P-1002",
                "patient_name": "Marcus Brody",
                "prescription_id": str(res3.inserted_id),
                "medication_name": "Metformin",
                "alert_type": "DOSAGE_EXCEEDED",
                "severity": "MEDIUM",
                "description": "Renal Function Warning",
                "reason": "Patient has documented Chronic Kidney Disease stage 3; eGFR monitoring required for Metformin.",
                "status": "acknowledged",
                "acknowledged_by": "Alex Chen, PharmD",
                "acknowledged_at": (datetime.utcnow() - timedelta(hours=5)).isoformat(),
                "created_at": (datetime.utcnow() - timedelta(days=2)).isoformat()
            })
            print("Seeded baseline safety alerts")

if __name__ == "__main__":
    seed_initial_data()

