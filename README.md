# HMEPS Module 3

## Overview

This repository contains the Module 3 implementation for the Healthcare Medical Error Prevention System (HMEPS), covering:

- Authentication
- User management
- Role-based access control
- Administration dashboard
- Audit logging
- Notifications
- Medical safety analytics
- Reports
- System monitoring

This module reads shared data from the team-owned collections such as `patients`, `prescriptions`, `safety_alerts`, and `medical_errors`, without duplicating their business logic.

## Folder structure

```text
HMEPS/
├── backend/
│   ├── app/
│   │   ├── analytics/
│   │   ├── audit/
│   │   ├── auth/
│   │   ├── middleware/
│   │   ├── monitoring/
│   │   ├── notifications/
│   │   ├── reports/
│   │   ├── users/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── utils.py
│   ├── requirements.txt
│   ├── run.py
│   └── test_module3.py
├── frontend/
│   ├── src/
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .gitignore
├── .env.example
├── .gitignore
├── README.md
└── .git
```

## MongoDB schema and shared collections

Module 3 creates:

- `users`
- `audit_logs`
- `notifications`

Module 3 consumes shared collections without recreating them:

- `patients`
- `prescriptions`
- `safety_alerts`
- `medical_errors`

### `users`

- `user_id`
- `name`
- `email`
- `password_hash`
- `role`
- `department`
- `status`
- `created_at`
- `last_login`

### `audit_logs`

- `log_id`
- `user_id`
- `action`
- `module`
- `target_id`
- `timestamp`
- `ip_address`
- `device_information`
- `description`

### `notifications`

- `notification_id`
- `user_id`
- `message`
- `severity`
- `read`
- `created_at`

## API documentation

### Authentication

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Users

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/<id>`
- `DELETE /api/users/<id>`

### Audit logs

- `GET /api/audit-logs`

### Notifications

- `GET /api/notifications`
- `PUT /api/notifications/<id>/read`

### Analytics

- `GET /api/analytics/overview`
- `GET /api/analytics/errors`
- `GET /api/analytics/alerts`

### Reports

- `GET /api/reports/errors`
- `GET /api/reports/alerts`

### Monitoring

- `GET /api/health`

## Authentication flow

1. User visits `/login`.
2. Frontend sends email and password to `/api/auth/login`.
3. Flask finds the user in MongoDB or memory-backed fallback.
4. Password is validated with `werkzeug.security.check_password_hash`.
5. User status is checked for `ACTIVE`.
6. JWT is created with the user ID, email, role, and expiration.
7. Frontend stores the token in local storage.
8. Protected requests attach the token in the `Authorization` header.
9. Flask validates the token and checks access rights before letting the request proceed.
10. Important actions log to `audit_logs`.

## Role permissions

- `ADMIN`: view users, audit logs, analytics, reports, dashboard, notifications
- `DOCTOR`: view authorized patient info and safety alerts
- `NURSE`: view patient info and authorized updates
- `PHARMACIST`: view prescriptions and medication alerts

## Audit logging design

The audit service is centralized in `backend/app/utils.py` using a reusable function that records structured log entries. Other modules can call the same logging function rather than duplicating logic. Module 3 logs login, user creation, updates, and disable actions.

## Notification design

Notifications are stored in the `notifications` collection and tied to the current user. Users only see record entries for their `user_id`. The UI includes a notification dropdown and unread badge in the top navigation.

## Analytics calculations

The dashboard uses actual database records from shared collections. Error detection rate is calculated as:

`(Total Detected Medical Errors / Total Safety Checks) * 100`

If there are no safety checks, the value is returned as 0 instead of causing division by zero.

## Environment variables

### Backend

```env
JWT_SECRET=change_this_to_a_strong_secret
MONGODB_URI=mongodb://localhost:27017/hmeps
MONGO_DB_NAME=hmeps
SECRET_KEY=change_this_to_a_secure_key
CORS_ORIGINS=http://localhost:5173
```

### Frontend

```env
VITE_API_URL=http://localhost:5000/api
```

## Setup instructions

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### MongoDB

Install MongoDB locally or use a cloud MongoDB URI and set `MONGODB_URI` in the backend environment.

## Run instructions

### Start backend

```bash
cd backend
.venv\Scripts\activate
python run.py
```

### Start frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

## Team integration

### Developer 1 integration

Expected shared collections to be available:

- `patients`
- `ehr_records`
- `allergies`
- `appointments`

Use references such as `patient_id` and `user_id` when building or reading related records.

### Developer 2 integration

Expected shared collections to be available:

- `prescriptions`
- `safety_alerts`
- `medical_errors`

Use references such as `prescription_id`, `alert_id`, and `user_id` when integrating notifications and analytics.

## Git instructions

```bash
git status
git add .
git commit -m "feat: implement module 3 administration security audit notifications analytics"
git push
```

## Production notes

- No plaintext passwords are stored.
- Password hashes are never exposed in API responses.
- JWT secrets and MongoDB credentials are kept in environment variables.
- The project includes a fallback in-memory database mode for demo/testing when MongoDB is unavailable.
