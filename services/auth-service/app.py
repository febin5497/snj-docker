import bcrypt
from flask import Blueprint, request
from shared import (
    create_service_app, db, success_response, error_response,
    get_current_user, get_current_user_claims, require_role,
    generate_tokens,
)

auth_bp = Blueprint("auth", __name__)


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(50), nullable=False, default="staff")
    company_id = db.Column(db.Integer, db.ForeignKey("companies.id"), nullable=False)
    password_change_required = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "company_id": self.company_id,
            "is_active": self.is_active,
            "password_change_required": self.password_change_required,
        }


def import_models():
    return User


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return error_response("Username and password are required", 400)

    user = User.query.filter_by(username=username).first()
    if not user or not user.is_active:
        return error_response("Invalid credentials", 401)

    if not bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8")):
        return error_response("Invalid credentials", 401)

    tokens = generate_tokens(user.id, user.username, user.role, user.company_id)
    return success_response(
        data={**tokens, "user": user.to_dict()},
        message="Login successful",
    )


@auth_bp.route("/api/auth/logout", methods=["POST"])
def logout():
    return success_response(message="Logged out successfully")


@auth_bp.route("/api/auth/me", methods=["GET"])
def me():
    user_id = get_current_user()
    if not user_id:
        return error_response("Authentication required", 401)

    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", 404)

    return success_response(data=user.to_dict())


@auth_bp.route("/api/auth/change-password", methods=["POST"])
def change_password():
    user_id = get_current_user()
    if not user_id:
        return error_response("Authentication required", 401)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if not current_password or not new_password:
        return error_response("Current and new password are required", 400)

    if len(new_password) < 8:
        return error_response("New password must be at least 8 characters", 400)

    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", 404)

    if not bcrypt.checkpw(current_password.encode("utf-8"), user.password_hash.encode("utf-8")):
        return error_response("Current password is incorrect", 401)

    user.password_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user.password_change_required = False
    db.session.commit()

    return success_response(message="Password changed successfully")


def create_app():
    app = create_service_app("auth-service", import_models)
    app.register_blueprint(auth_bp)
    return app
