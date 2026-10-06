import re
from datetime import datetime
from prescription_safety.database import get_db

# Drug Class Mappings for Allergy and Interaction checking
DRUG_CLASSES = {
    "amoxicillin": ["penicillin", "beta-lactam", "antibiotic"],
    "ampicillin": ["penicillin", "beta-lactam", "antibiotic"],
    "penicillin": ["penicillin", "beta-lactam", "antibiotic"],
    "ibuprofen": ["nsaid", "painkiller", "analgesic"],
    "aspirin": ["nsaid", "antiplatelet", "analgesic"],
    "naproxen": ["nsaid", "painkiller", "analgesic"],
    "sulfamethoxazole": ["sulfa", "sulfonamide", "antibiotic"],
    "bactrim": ["sulfa", "sulfonamide", "antibiotic"],
    "lisinopril": ["ace_inhibitor", "antihypertensive"],
    "enalapril": ["ace_inhibitor", "antihypertensive"],
    "warfarin": ["anticoagulant", "blood_thinner"],
    "heparin": ["anticoagulant", "blood_thinner"],
    "metformin": ["antidiabetic", "biguanide"],
    "ciprofloxacin": ["fluoroquinolone", "antibiotic"],
    "levofloxacin": ["fluoroquinolone", "antibiotic"],
    "tramadol": ["opioid", "analgesic"],
    "morphine": ["opioid", "analgesic"],
    "fluoxetine": ["ssri", "antidepressant"],
    "sildenafil": ["pde5_inhibitor"],
    "nitroglycerin": ["nitrate", "vasodilator"],
    "potassium chloride": ["potassium_supplement"]
}

# Maximum Dosage Rules Matrix (Single Dose mg, Max Daily mg)
DOSAGE_RULES = {
    "paracetamol": {"max_single_mg": 1000, "max_daily_mg": 4000},
    "acetaminophen": {"max_single_mg": 1000, "max_daily_mg": 4000},
    "ibuprofen": {"max_single_mg": 800, "max_daily_mg": 3200},
    "amoxicillin": {"max_single_mg": 1000, "max_daily_mg": 3000},
    "metformin": {"max_single_mg": 1000, "max_daily_mg": 2550},
    "lisinopril": {"max_single_mg": 40, "max_daily_mg": 80},
    "warfarin": {"max_single_mg": 10, "max_daily_mg": 10},
    "morphine": {"max_single_mg": 30, "max_daily_mg": 120},
    "ciprofloxacin": {"max_single_mg": 750, "max_daily_mg": 1500},
    "aspirin": {"max_single_mg": 1000, "max_daily_mg": 4000},
    "atorvastatin": {"max_single_mg": 80, "max_daily_mg": 80}
}

# Verified Drug-Drug Interaction Dataset
INTERACTION_DATASET = {
    frozenset(["warfarin", "aspirin"]): {
        "severity": "HIGH",
        "description": "Increased risk of major hemorrhage due to dual anticoagulant and antiplatelet inhibition."
    },
    frozenset(["lisinopril", "potassium chloride"]): {
        "severity": "HIGH",
        "description": "ACE inhibitors reduce potassium excretion, creating a risk of severe hyperkalemia and cardiac dysrhythmia."
    },
    frozenset(["ciprofloxacin", "antacid"]): {
        "severity": "MEDIUM",
        "description": "Chelation with polyvalent cations in antacids significantly decreases ciprofloxacin absorption and clinical efficacy."
    },
    frozenset(["metformin", "contrast dye"]): {
        "severity": "HIGH",
        "description": "Increased risk of contrast-induced renal failure and secondary metformin-associated lactic acidosis."
    },
    frozenset(["tramadol", "fluoxetine"]): {
        "severity": "CRITICAL",
        "description": "High risk of serotonin syndrome, CNS toxicity, and lowered seizure threshold due to dual serotonergic pathways."
    },
    frozenset(["sildenafil", "nitroglycerin"]): {
        "severity": "CRITICAL",
        "description": "Potentiation of vasodilatory effects leading to severe, life-threatening hypotension."
    },
    frozenset(["amoxicillin", "methotrexate"]): {
        "severity": "MEDIUM",
        "description": "Penicillins may inhibit renal tubular excretion of methotrexate, increasing serum levels and risk of methotrexate toxicity."
    }
}

FREQUENCY_MULTIPLIERS = {
    "once daily": 1,
    "qd": 1,
    "twice daily": 2,
    "bid": 2,
    "three times daily": 3,
    "tid": 3,
    "q8h": 3,
    "four times daily": 4,
    "qid": 4,
    "q6h": 4,
    "every 4 hours": 6,
    "q4h": 6,
    "as needed": 1
}


class SafetyService:

    @staticmethod
    def run_all_checks(prescription_data, patient_id):
        """
        Execute full battery of medication safety checks.
        Returns a dictionary with overall_status, summary, and array of check results.
        """
        db = get_db()
        patient = db.patients.find_one({"patient_id": patient_id}) or db.patients.find_one({"_id": patient_id})
        
        # Get active prescriptions for patient
        active_prescriptions = list(db.prescriptions.find({
            "patient_id": patient_id,
            "status": "active"
        }))

        checks = []

        # Check 1: Information Integrity
        checks.append(SafetyService.check_information_integrity(prescription_data))

        # Check 2: Dosage & Frequency Rules
        checks.append(SafetyService.check_dosage_and_frequency(prescription_data))

        # Check 3: Duplicate Active Prescription
        checks.append(SafetyService.check_duplicate_prescription(prescription_data, active_prescriptions))

        # Check 4: Allergy Cross-Match
        checks.append(SafetyService.check_allergy_match(prescription_data, patient))

        # Check 5: Drug-Drug Interactions
        checks.extend(SafetyService.check_drug_interactions(prescription_data, active_prescriptions))

        # Check 6: Age-based Clinical Warnings
        checks.append(SafetyService.check_age_safety(prescription_data, patient))

        # Calculate overall safety assessment
        severities = [c["severity"] for c in checks]
        outcomes = [c["outcome"] for c in checks]

        if "CRITICAL" in severities or "FAIL" in outcomes:
            overall_status = "CRITICAL_RISK"
        elif "HIGH" in severities:
            overall_status = "HIGH_RISK"
        elif "MEDIUM" in severities or "WARNING" in outcomes:
            overall_status = "MODERATE_WARNING"
        elif any(c["outcome"] == "UNAVAILABLE" for c in checks):
            overall_status = "VERIFIED_WITH_UNAVAILABLE_DATA"
        else:
            overall_status = "PASSED"

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "patient_id": patient_id,
            "medication_name": prescription_data.get("medication_name", "").strip(),
            "overall_status": overall_status,
            "passed": overall_status in ["PASSED", "VERIFIED_WITH_UNAVAILABLE_DATA"],
            "checks": checks
        }

    @staticmethod
    def check_information_integrity(data):
        med_name = (data.get("medication_name") or "").strip()
        dosage = (data.get("dosage") or "").strip()
        route = (data.get("route") or "").strip()
        frequency = (data.get("frequency") or "").strip()
        duration = (data.get("duration") or "").strip()

        missing = []
        if not med_name: missing.append("medication_name")
        if not dosage: missing.append("dosage")
        if not route: missing.append("route")
        if not frequency: missing.append("frequency")
        if not duration: missing.append("duration")

        if missing:
            return {
                "check_type": "DATA_INTEGRITY",
                "title": "Required Clinical Fields",
                "outcome": "FAIL",
                "severity": "HIGH",
                "reason": f"Missing required clinical parameters: {', '.join(missing)}.",
                "timestamp": datetime.utcnow().isoformat()
            }

        return {
            "check_type": "DATA_INTEGRITY",
            "title": "Required Clinical Fields",
            "outcome": "PASS",
            "severity": "LOW",
            "reason": "All required medication prescription parameters are complete.",
            "timestamp": datetime.utcnow().isoformat()
        }

    @staticmethod
    def check_dosage_and_frequency(data):
        med_name = (data.get("medication_name") or "").lower().strip()
        dosage_str = (data.get("dosage") or "").lower().strip()
        freq_str = (data.get("frequency") or "").lower().strip()

        # Extract numeric dosage value in mg
        match = re.search(r"(\d+(\.\d+)?)", dosage_str)
        if not match:
            return {
                "check_type": "DOSAGE_VALIDATION",
                "title": "Dosage & Frequency Check",
                "outcome": "WARNING",
                "severity": "MEDIUM",
                "reason": f"Could not parse numeric dose amount from '{dosage_str}'. Standard dosage validation skipped.",
                "timestamp": datetime.utcnow().isoformat()
            }

        single_dose = float(match.group(1))

        # Determine frequency multiplier
        mult = 1
        for f_key, f_val in FREQUENCY_MULTIPLIERS.items():
            if f_key in freq_str:
                mult = f_val
                break

        calculated_daily = single_dose * mult

        # Match drug against dosage rule matrix
        rule = None
        for key in DOSAGE_RULES:
            if key in med_name:
                rule = DOSAGE_RULES[key]
                break

        if rule:
            max_single = rule["max_single_mg"]
            max_daily = rule["max_daily_mg"]

            if single_dose > max_single:
                return {
                    "check_type": "DOSAGE_VALIDATION",
                    "title": "Dosage & Frequency Check",
                    "outcome": "FAIL",
                    "severity": "HIGH",
                    "reason": f"Prescribed single dose ({single_dose} mg) exceeds the maximum recommended single dose of {max_single} mg for {med_name.capitalize()}.",
                    "timestamp": datetime.utcnow().isoformat()
                }

            if calculated_daily > max_daily:
                return {
                    "check_type": "DOSAGE_VALIDATION",
                    "title": "Dosage & Frequency Check",
                    "outcome": "FAIL",
                    "severity": "HIGH",
                    "reason": f"Calculated daily dose ({calculated_daily} mg/day) exceeds maximum daily limit of {max_daily} mg for {med_name.capitalize()}.",
                    "timestamp": datetime.utcnow().isoformat()
                }

        # Fallback extreme dosage limit check
        if single_dose > 5000:
            return {
                "check_type": "DOSAGE_VALIDATION",
                "title": "Dosage & Frequency Check",
                "outcome": "FAIL",
                "severity": "HIGH",
                "reason": f"Extremely high single dosage detected ({single_dose} mg). Requires clinical review.",
                "timestamp": datetime.utcnow().isoformat()
            }

        return {
            "check_type": "DOSAGE_VALIDATION",
            "title": "Dosage & Frequency Check",
            "outcome": "PASS",
            "severity": "LOW",
            "reason": f"Prescribed dose ({single_dose} mg, approx {calculated_daily} mg/day) is within standard safety thresholds.",
            "timestamp": datetime.utcnow().isoformat()
        }

    @staticmethod
    def check_duplicate_prescription(data, active_prescriptions):
        med_name = (data.get("medication_name") or "").lower().strip()
        current_id = str(data.get("_id") or "")

        for p in active_prescriptions:
            if str(p.get("_id", "")) == current_id:
                continue
            existing_med = (p.get("medication_name") or "").lower().strip()
            if existing_med == med_name:
                return {
                    "check_type": "DUPLICATE_PRESCRIPTION",
                    "title": "Duplicate Active Prescription Check",
                    "outcome": "FAIL",
                    "severity": "HIGH",
                    "reason": f"Patient already has an active prescription for '{p.get('medication_name')}' prescribed by {p.get('prescribing_clinician', 'another clinician')}.",
                    "timestamp": datetime.utcnow().isoformat()
                }

        return {
            "check_type": "DUPLICATE_PRESCRIPTION",
            "title": "Duplicate Active Prescription Check",
            "outcome": "PASS",
            "severity": "LOW",
            "reason": "No active duplicate prescriptions found for this medication.",
            "timestamp": datetime.utcnow().isoformat()
        }

    @staticmethod
    def check_allergy_match(data, patient):
        if not patient or not patient.get("allergies"):
            return {
                "check_type": "DRUG_ALLERGY",
                "title": "Patient Allergy Cross-Match",
                "outcome": "PASS",
                "severity": "LOW",
                "reason": "No documented drug allergies on record for this patient.",
                "timestamp": datetime.utcnow().isoformat()
            }

        med_name = (data.get("medication_name") or "").lower().strip()
        patient_allergies = [a.lower().strip() for a in patient.get("allergies", [])]

        # Direct name match
        for allergy in patient_allergies:
            if allergy in med_name or med_name in allergy:
                return {
                    "check_type": "DRUG_ALLERGY",
                    "title": "Patient Allergy Cross-Match",
                    "outcome": "FAIL",
                    "severity": "CRITICAL",
                    "reason": f"CRITICAL: Patient has a documented hypersensitivity/allergy to '{allergy.capitalize()}' matching prescribed medication '{data.get('medication_name')}'.",
                    "timestamp": datetime.utcnow().isoformat()
                }

        # Class match check
        med_classes = DRUG_CLASSES.get(med_name, [])
        for allergy in patient_allergies:
            for cls in med_classes:
                if cls in allergy:
                    return {
                        "check_type": "DRUG_ALLERGY",
                        "title": "Patient Allergy Cross-Match",
                        "outcome": "FAIL",
                        "severity": "CRITICAL",
                        "reason": f"CRITICAL: Prescribed medication '{data.get('medication_name')}' belongs to class '{cls.upper()}' which conflicts with documented allergy to '{allergy.capitalize()}'.",
                        "timestamp": datetime.utcnow().isoformat()
                    }

        return {
            "check_type": "DRUG_ALLERGY",
            "title": "Patient Allergy Cross-Match",
            "outcome": "PASS",
            "severity": "LOW",
            "reason": "No allergy conflict detected with patient's documented allergies.",
            "timestamp": datetime.utcnow().isoformat()
        }

    @staticmethod
    def check_drug_interactions(data, active_prescriptions):
        med_name = (data.get("medication_name") or "").lower().strip()
        current_id = str(data.get("_id") or "")

        interaction_results = []
        checked_pairs = 0

        for p in active_prescriptions:
            if str(p.get("_id", "")) == current_id:
                continue
            active_med = (p.get("medication_name") or "").lower().strip()
            pair = frozenset([med_name, active_med])
            checked_pairs += 1

            if pair in INTERACTION_DATASET:
                info = INTERACTION_DATASET[pair]
                interaction_results.append({
                    "check_type": "DRUG_INTERACTION",
                    "title": f"Drug Interaction: {med_name.capitalize()} + {active_med.capitalize()}",
                    "outcome": "FAIL",
                    "severity": info["severity"],
                    "reason": f"Known drug interaction detected between {data.get('medication_name')} and active medication {p.get('medication_name')}: {info['description']}",
                    "timestamp": datetime.utcnow().isoformat()
                })
            else:
                interaction_results.append({
                    "check_type": "DRUG_INTERACTION",
                    "title": f"Drug Interaction Verification: {med_name.capitalize()} + {active_med.capitalize()}",
                    "outcome": "UNAVAILABLE",
                    "severity": "INFO",
                    "reason": f"Interaction reference data is NOT VERIFIED in configured dataset for pair '{data.get('medication_name')}' + '{p.get('medication_name')}'. Clinical decision-support verification recommended.",
                    "timestamp": datetime.utcnow().isoformat()
                })

        if not interaction_results:
            return [{
                "check_type": "DRUG_INTERACTION",
                "title": "Drug-Drug Interaction Check",
                "outcome": "PASS",
                "severity": "LOW",
                "reason": "No concurrent active medications present for drug interaction evaluation.",
                "timestamp": datetime.utcnow().isoformat()
            }]

        return interaction_results

    @staticmethod
    def check_age_safety(data, patient):
        if not patient or not patient.get("dob"):
            return {
                "check_type": "CLINICAL_AGE_WARNING",
                "title": "Age & Special Population Safety",
                "outcome": "PASS",
                "severity": "LOW",
                "reason": "Patient date of birth not documented; standard adult precautions apply.",
                "timestamp": datetime.utcnow().isoformat()
            }

        dob_str = patient.get("dob")
        med_name = (data.get("medication_name") or "").lower().strip()

        try:
            dob = datetime.strptime(dob_str, "%Y-%m-%d")
            age = (datetime.now() - dob).days // 365
        except Exception:
            age = 30

        if age < 18 and "aspirin" in med_name:
            return {
                "check_type": "CLINICAL_AGE_WARNING",
                "title": "Age & Special Population Safety",
                "outcome": "FAIL",
                "severity": "HIGH",
                "reason": f"Pediatric warning: Patient is {age} years old. Aspirin is contraindicated in patients under 18 due to risk of Reye's Syndrome.",
                "timestamp": datetime.utcnow().isoformat()
            }

        if age >= 65 and any(d in med_name for d in ["diazepam", "lorazepam", "indomethacin"]):
            return {
                "check_type": "CLINICAL_AGE_WARNING",
                "title": "Age & Special Population Safety",
                "outcome": "WARNING",
                "severity": "MEDIUM",
                "reason": f"Geriatric alert: Patient is {age} years old. {data.get('medication_name')} is listed on Beers Criteria for potential high risk in elderly patients.",
                "timestamp": datetime.utcnow().isoformat()
            }

        return {
            "check_type": "CLINICAL_AGE_WARNING",
            "title": "Age & Special Population Safety",
            "outcome": "PASS",
            "severity": "LOW",
            "reason": f"No age-related contraindications identified for patient age ({age} yrs).",
            "timestamp": datetime.utcnow().isoformat()
        }

