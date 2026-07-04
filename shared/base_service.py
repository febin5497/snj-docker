import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .database import init_db


def create_service_app(service_name, import_models_fn=None):
    app = Flask(service_name)
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "construction-erp-secret-key-2026")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 86400

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)

    with app.app_context():
        init_db(app)
        if import_models_fn:
            import_models_fn()

    return app
