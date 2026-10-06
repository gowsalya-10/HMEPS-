from datetime import datetime
from prescription_safety.database import get_db

class NotificationService:
    @staticmethod
    def send_alert_notification(alert):
        """
        Trigger notification for high/critical safety alerts (Module 3 integration point).
        """
        try:
            db = get_db()
            notification = {
                "alert_id": str(alert.get("_id", "")),
                "patient_id": alert.get("patient_id"),
                "severity": alert.get("severity"),
                "title": f"Safety Alert: {alert.get('alert_type')}",
                "message": alert.get("description"),
                "status": "unread",
                "target_roles": ["doctor", "pharmacist", "admin"],
                "created_at": datetime.utcnow().isoformat()
            }
            db.notifications.insert_one(notification)
            return True
        except Exception as e:
            print(f"Notification creation failed: {e}")
            return False

