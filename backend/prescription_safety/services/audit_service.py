from datetime import datetime
from prescription_safety.database import get_db

class AuditService:
    @staticmethod
    def log_event(action, user_info, target_type, target_id, details=None, ip_address=None):
        """
        Record audit log event for Module 3 integration.
        """
        try:
            db = get_db()
            audit_entry = {
                "action": action,
                "user_id": user_info.get("user_id") if user_info else "system",
                "user_name": user_info.get("name") if user_info else "System",
                "user_role": user_info.get("role") if user_info else "system",
                "target_type": target_type,
                "target_id": str(target_id),
                "details": details or {},
                "ip_address": ip_address or "127.0.0.1",
                "created_at": datetime.utcnow().isoformat()
            }
            db.audit_logs.insert_one(audit_entry)
            return True
        except Exception as e:
            print(f"Audit log failed: {e}")
            return False

