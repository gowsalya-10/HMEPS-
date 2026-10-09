# Healthcare Medical Error Prevention System (HMEPS)

HMEPS is a comprehensive healthcare platform integrating **Patient Electronic Health Records (EHR)** and **Administration, Security, Audit, Notifications, Analytics, and Reporting (Module 3)**.

## System Overview

- **Patient EHR & Clinical Management**: Patient registration, medical records, vital signs, lab reports, and appointments management.
- **Administration & Security**: Authentication, role-based access control (RBAC), user management, audit logging, system monitoring, and safety analytics.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React, Recharts
- **Backend**: Python 3.10+, Flask, PyMongo, PyJWT, Werkzeug
- **Database**: MongoDB (with fallback in-memory database support for development/testing)
- **Architecture**: Modular REST API with JWT authentication middleware

## Directory Structure

```text
HMEPS/
├── backend/
│   ├── app/
│   │   ├── analytics/        # Analytics API endpoints
│   │   ├── audit/            # Audit logging endpoints
│   │   ├── auth/             # Authentication endpoints
│   │   ├── middleware/       # Auth & JWT verification middleware
│   │   ├── monitoring/       # System health & monitoring
│   │   ├── notifications/    # User notification services
│   │   ├── reports/          # Medical error & alert reports
│   │   ├── users/            # User administration routes
│   │   ├── __init__.py       # App factory & Blueprint registration
│   │   ├── config.py         # App configuration
│   │   ├── database.py       # MongoDB & fallback database handling
│   │   └── utils.py          # Shared helpers & audit logger
│   ├── requirements.txt      # Backend Python dependencies
│   ├── run.py                # Server entry point
│   └── test_module3.py       # Module test suite
└── frontend/
    ├── src/
    │   ├── components/       # Layout, Navigation, and reusable components
    │   ├── context/          # AuthContext for state management
    │   ├── pages/            # Application views (Dashboard, Patient Management, Analytics, etc.)
    │   ├── routes/           # ProtectedRoute component
    │   ├── services/         # API client setup
    │   ├── App.jsx           # Main routing & application layout
    │   ├── main.jsx          # React entry point
    │   └── index.css         # Global Tailwind & base styling
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    └── vite.config.js
```

## Database Schema & Collections

### Core Collections
- **`patients`**: Patient demographics, contact info, blood group, known allergies, and medical conditions.
- **`medical_records`**: Electronic Health Record notes and clinical history.
- **`vital_signs`**: Temperature, blood pressure, heart rate, oxygen saturation, and weight entries.
- **`lab_reports`**: Diagnostic tests, results, reference ranges, and doctor notes.
- **`appointments`**: Doctor schedules, patient appointments, and visit statuses.

### Administration & Security Collections
- **`users`**: User accounts, credentials (hashed), roles (`ADMIN`, `DOCTOR`, `NURSE`, `PHARMACIST`), and status.
- **`audit_logs`**: System audit trails for access, security events, and record modifications.
- **`notifications`**: User-specific alerts and system notifications.
- **`safety_alerts` & `medical_errors`**: Safety monitoring and medical error prevention data.

## Key API Endpoints

### Authentication & Users
- `POST /api/auth/login` - Authenticate user & issue JWT
- `GET /api/auth/me` - Get current user profile
- `GET/POST /api/users` - User management (Admin)
- `PUT/DELETE /api/users/<id>` - Update/disable user accounts

### Patient & EHR Management
- `GET/POST /api/patients` - List and register patients
- `GET/PUT/DELETE /api/patients/<id>` - Patient profile management
- `GET/POST /api/patients/<id>/records` - EHR records
- `GET/POST /api/patients/<id>/vitals` - Vital signs
- `GET/POST /api/patients/<id>/labs` - Lab reports
- `GET/POST /api/appointments` - Appointment scheduling

### Audit, Analytics & Reports
- `GET /api/audit-logs` - System audit log viewer
- `GET /api/notifications` - User notifications
- `GET /api/analytics/overview` - Medical error & safety analytics
- `GET /api/reports/errors` - Exportable safety reports
- `GET /api/health` - System health check

## Setup & Running Locally

### Environment Setup

Create `.env` in `backend/`:
```env
SECRET_KEY=hmeps_super_secret_key
JWT_SECRET=hmeps_jwt_secret_key
MONGODB_URI=mongodb://localhost:27017/hmeps
MONGO_DB_NAME=hmeps
CORS_ORIGINS=http://localhost:5173
```

### Start Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows (or source .venv/bin/activate on Linux/macOS)
pip install -r requirements.txt
python run.py
```

*Backend runs on `http://localhost:5000`.*

### Start Frontend

```bash
cd frontend
npm install
npm run dev
```

*Frontend runs on `http://localhost:5173`.*

## Build & Testing

### Frontend Production Build
```bash
cd frontend
npm run build
```

### Backend Tests
```bash
cd backend
python test_module3.py
```
