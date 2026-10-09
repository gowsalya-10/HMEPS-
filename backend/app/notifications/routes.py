from flask import Blueprint, g, jsonify, request

from app.database import get_db
from app.middleware.auth import require_auth
from app.utils import serialise_record

notifications_bp = Blueprint("notifications_bp", __name__)


@notifications_bp.route("/notifications", methods=["GET"])
@require_auth
def list_notifications():
    db = get_db()
    user_id = g.current_user["user_id"]
    notifications = db["notifications"].find({"user_id": user_id})
    notifications = sorted(notifications, key=lambda item: item.get("created_at", ""), reverse=True)
    return jsonify({"success": True, "notifications": serialise_record(notifications)})


@notifications_bp.route("/notifications/<notification_id>/read", methods=["PUT"])
@require_auth
def mark_notification_read(notification_id):
    db = get_db()
    result = db["notifications"].update_one({"notification_id": notification_id, "user_id": g.current_user["user_id"]}, {"$set": {"read": True}})
    if result.matched_count == 0:
        return jsonify({"success": False, "message": "Notification not found"}), 404
    return jsonify({"success": True, "message": "Notification marked as read"})
