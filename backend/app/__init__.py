import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

from app.config import Config
from app.database import initialize_database, seed_demo_data

# Ensure parent directory is in sys.path so routes.py can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import routes


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    initialize_database()
    seed_demo_data()

    from app.auth.routes import auth_bp
    from app.users.routes import users_bp
    from app.audit.routes import audit_bp
    from app.notifications.routes import notifications_bp
    from app.analytics.routes import analytics_bp
    from app.reports.routes import reports_bp
    from app.monitoring.routes import monitoring_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api")
    app.register_blueprint(audit_bp, url_prefix="/api")
    app.register_blueprint(notifications_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    app.register_blueprint(monitoring_bp, url_prefix="/api")
    app.register_blueprint(routes.bp, url_prefix="/api")

    @app.get("/")
    def api_root():
        return jsonify({"message": "HMEPS System API is running"})

    return app
