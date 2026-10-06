# Healthcare Medical Error Prevention System (HMEPS) - Module 1

This is **Module 1 (Patient & Electronic Health Record)** of the HMEPS system. It handles patient registration, profiles, vital signs, lab reports, EHR history, and appointments.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, React Router, Axios, Lucide React
- **Backend**: Python, Flask, Flask-CORS, PyMongo
- **Database**: MongoDB
- **Architecture**: REST API with separate Frontend/Backend

## Folder Structure
```
HMEPS/
├── backend/
│   ├── app.py              # Flask app entry point & server config
│   ├── config.py           # Environment config (MongoDB URI, JWT secret)
│   ├── db.py               # MongoDB connection handling
│   ├── routes.py           # REST API endpoints implementation
│   └── requirements.txt    # Python dependencies
└── frontend/
    ├── package.json        # Node dependencies & scripts
    ├── tailwind.config.js  # Tailwind styling configuration
    ├── index.html          # Vite HTML entry point
    └── src/
        ├── api.js          # Axios configuration for backend communication
        ├── App.jsx         # React Router setup
        ├── main.jsx        # React DOM rendering
        ├── index.css       # Global CSS & Tailwind imports
        ├── components/     # Reusable UI components (Sidebar, Layout, TopNav)
        └── pages/          # Full-page components (Dashboard, PatientList, etc.)
```

## MongoDB Schema Details
This module uses a schema-less NoSQL structure but enforces the following document shapes in code:

**`patients` Collection:**
- `patient_id` (String, Unique): e.g., "PT-001"
- `full_name` (String)
- `dob` (Date String)
- `gender` (String)
- `phone` (String)
- `email` (String)
- `address` (String)
- `blood_group` (String)
- `emergency_contact` (String)
- `known_allergies` (String)
- `existing_conditions` (String)
- `created_at` (Datetime)

**`medical_records` Collection:**
- `patient_objectId` (String): Reference to Patient _id
- `doctor_id` (String)
- `record_type` (String)
- `description` (String)
- `created_at` (Datetime)

**`vital_signs` Collection:**
- `patient_objectId` (String)
- `temperature`, `blood_pressure`, `heart_rate`, `respiratory_rate`, `oxygen_saturation`, `weight`
- `date` (Datetime)

**`lab_reports` Collection:**
- `patient_objectId` (String)
- `test_name`, `result`, `reference_range`, `status`, `doctor_notes`
- `date` (Datetime)

**`appointments` Collection:**
- `patient_id` (String)
- `doctor_id` (String)
- `date` (Date String)
- `time` (Time String)
- `reason` (String)
- `status` (String: "Scheduled", "Completed", "Cancelled")

## REST API Endpoints
All endpoints are prefixed with `/api`.
- `GET /api/patients` - List all patients (supports `?search=query`)
- `POST /api/patients` - Register a new patient
- `GET /api/patients/<id>` - Get patient details
- `PUT /api/patients/<id>` - Update patient details
- `DELETE /api/patients/<id>` - Delete a patient
- `GET/POST /api/patients/<id>/records` - EHR records
- `GET/POST /api/patients/<id>/vitals` - Vital signs
- `GET/POST /api/patients/<id>/labs` - Lab reports
- `GET/POST /api/appointments` - Appointments
- `PUT/DELETE /api/appointments/<id>` - Manage specific appointment

*(Note: JWT Authentication is assumed to be implemented at an API Gateway/Middleware level in the shared project structure, utilizing `Config.SECRET_KEY`.)*

## How to Run

### 1. Start MongoDB
Ensure you have MongoDB running locally on `mongodb://localhost:27017` or update the `MONGO_URI` in `backend/config.py` (or `.env`).

### 2. Run the Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # (Windows)
pip install -r requirements.txt
python app.py
```
*Backend will run on `http://localhost:5000`*

### 3. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend will run on the Vite default port (usually `http://localhost:5173`)*

## Team Integration Notes
- **To Team Member 2 (Prescriptions)**: When you need to verify patient allergies, query `GET /api/patients/<id>` and check the `known_allergies` field. Add your prescription models as a separate collection.
- **To Team Member 3 (Admin/Security)**: You can enforce role-based access control (RBAC) in the `routes.py` before returning data, or wrap our Blueprints in your custom decorators.
