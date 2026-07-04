import bcrypt
from flask import Blueprint, request
from shared import (
    create_service_app, db, success_response, error_response,
    get_current_user, get_current_user_claims, require_role,
    paginate_query, TimestampMixin, CompanyMixin,
)

user_bp = Blueprint("users", __name__)


class User(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(50), nullable=False, default="staff")
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
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


def import_models():
    return User


@user_bp.route("/api/users", methods=["GET"])
def list_users():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    role = request.args.get("role")
    search = request.args.get("search", "").strip()

    query = User.query.filter_by(company_id=company_id)
    if role:
        query = query.filter_by(role=role)
    if search:
        query = query.filter(User.username.ilike(f"%{search}%"))

    query = query.order_by(User.id.desc())
    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@user_bp.route("/api/users", methods=["POST"])
@require_role("super_admin", "admin")
def create_user():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    username = data.get("username", "").strip()
    password = data.get("password", "")
    role = data.get("role", "staff")

    if not username or not password:
        return error_response("Username and password are required", 400)

    if User.query.filter_by(username=username).first():
        return error_response("Username already exists", 409)

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user = User(
        username=username,
        password_hash=password_hash,
        role=role,
        company_id=company_id,
        password_change_required=True,
        is_active=True,
    )
    db.session.add(user)
    db.session.commit()

    return success_response(data=user.to_dict(), message="User created", status=201)


@user_bp.route("/api/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    user = User.query.filter_by(id=user_id, company_id=company_id).first()
    if not user:
        return error_response("User not found", 404)

    return success_response(data=user.to_dict())


@user_bp.route("/api/users/<int:user_id>", methods=["PUT"])
@require_role("super_admin", "admin")
def update_user(user_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    user = User.query.filter_by(id=user_id, company_id=company_id).first()
    if not user:
        return error_response("User not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    if "role" in data:
        user.role = data["role"]
    if "is_active" in data:
        user.is_active = data["is_active"]
    if "password_change_required" in data:
        user.password_change_required = data["password_change_required"]
    if "password" in data and data["password"]:
        user.password_hash = bcrypt.hashpw(
            data["password"].encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    db.session.commit()
    return success_response(data=user.to_dict(), message="User updated")


@user_bp.route("/api/users/<int:user_id>", methods=["DELETE"])
@require_role("super_admin", "admin")
def delete_user(user_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    user = User.query.filter_by(id=user_id, company_id=company_id).first()
    if not user:
        return error_response("User not found", 404)

    user.is_active = False
    db.session.commit()
    return success_response(message="User deactivated")


@user_bp.route("/api/users/<int:user_id>/roles", methods=["GET"])
def get_user_roles(user_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    user = User.query.filter_by(id=user_id, company_id=company_id).first()
    if not user:
        return error_response("User not found", 404)

    return success_response(data={"role": user.role, "user_id": user.id})


def create_app():
    app = create_service_app("user-service", import_models)
    app.register_blueprint(user_bp)
    return app
