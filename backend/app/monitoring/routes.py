from datetime import datetime

from flask import Blueprint, jsonify

from app.database import get_db, is_mongo_connected

monitoring_bp = Blueprint("monitoring_bp", __name__)


@monitoring_bp.route("/health", methods=["GET"])
def health_check():
    db = get_db()
    status = "ok" if db is not None else "unavailable"
    return jsonify({
        "success": True,
        "backend": "available",
        "status": status,
        "mongodb": "connected" if is_mongo_connected() else "memory-fallback",
        "timestamp": datetime.utcnow().isoformat(),
    })
