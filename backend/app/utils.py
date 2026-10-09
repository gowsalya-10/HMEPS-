from datetime import datetime
import uuid

from app.database import get_db


def serialise_record(record):
    if record is None:
        return None
    if isinstance(record, list):
        return [serialise_record(item) for item in record]
    if isinstance(record, dict):
        cleaned = {}
        for key, value in record.items():
            if key == '_id':
                continue
            if isinstance(value, datetime):
                cleaned[key] = value.isoformat()
            elif isinstance(value, dict):
                cleaned[key] = serialise_record(value)
            elif isinstance(value, list):
                cleaned[key] = serialise_record(value)
            else:
                cleaned[key] = value
        return cleaned
    return record


def audit_event(user_id, action, module, target_id=None, description="", ip_address="unknown", device_information="web"):
    db = get_db()
    log = {
        "log_id": str(uuid.uuid4()),
        "user_id": user_id,
        "action": action,
        "module": module,
        "target_id": target_id,
        "timestamp": datetime.utcnow().isoformat(),
        "ip_address": ip_address,
        "device_information": device_information,
        "description": description,
    }
    db["audit_logs"].insert_one(log)
    return log


def create_notification(user_id, message, severity="info"):
    db = get_db()
    notification = {
        "notification_id": str(uuid.uuid4()),
        "user_id": user_id,
        "message": message,
        "severity": severity,
        "read": False,
        "created_at": datetime.utcnow().isoformat(),
    }
    db["notifications"].insert_one(notification)
    return notification


def get_user_safe(user):
    if not user:
        return None
    cleaned = serialise_record(dict(user))
    cleaned.pop("password_hash", None)
    cleaned.pop("_id", None)
    return cleaned
