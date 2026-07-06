from flask import Blueprint, request
from shared import (
    create_service_app, db, success_response, error_response,
    get_current_user, get_current_user_claims, require_role,
    paginate_query, TimestampMixin,
)

company_bp = Blueprint("companies", __name__)


class Company(db.Model, TimestampMixin):
    __tablename__ = "companies"
    __table_args__ = {"extend_existing": True}
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.Text)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    gst_number = db.Column(db.String(20))
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "address": self.address,
            "phone": self.phone,
            "email": self.email,
            "gst_number": self.gst_number,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class CompanySettings(db.Model, TimestampMixin):
    __tablename__ = "company_settings"
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("companies.id"), nullable=False)
    key = db.Column(db.String(100), nullable=False)
    value = db.Column(db.Text)
    __table_args__ = (db.UniqueConstraint("company_id", "key"),)

    def to_dict(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "key": self.key,
            "value": self.value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


def import_models():
    return Company, CompanySettings


@company_bp.route("/api/companies", methods=["GET"])
@require_role("super_admin")
def list_companies():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    search = request.args.get("search", "").strip()

    query = Company.query
    if search:
        query = query.filter(Company.name.ilike(f"%{search}%"))
    query = query.order_by(Company.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@company_bp.route("/api/companies", methods=["POST"])
@require_role("super_admin")
def create_company():
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    name = data.get("name", "").strip()
    if not name:
        return error_response("Company name is required", 400)

    company = Company(
        name=name,
        address=data.get("address", ""),
        phone=data.get("phone", ""),
        email=data.get("email", ""),
        gst_number=data.get("gst_number", ""),
        is_active=True,
    )
    db.session.add(company)
    db.session.flush()

    defaults = {
        "currency": "INR",
        "timezone": "Asia/Kolkata",
        "date_format": "DD/MM/YYYY",
    }
    for key, value in defaults.items():
        setting = CompanySettings(company_id=company.id, key=key, value=value)
        db.session.add(setting)

    db.session.commit()
    return success_response(data=company.to_dict(), message="Company created", status=201)


@company_bp.route("/api/companies/<int:company_id>", methods=["GET"])
def get_company(company_id):
    claims = get_current_user_claims()
    role = claims.get("role", "")
    if role not in ("super_admin", "admin") and claims.get("company_id") != company_id:
        return error_response("Access denied", 403)

    company = Company.query.get(company_id)
    if not company:
        return error_response("Company not found", 404)

    return success_response(data=company.to_dict())


@company_bp.route("/api/companies/<int:company_id>", methods=["PUT"])
@require_role("super_admin", "admin")
def update_company(company_id):
    claims = get_current_user_claims()
    if claims.get("role") != "super_admin" and claims.get("company_id") != company_id:
        return error_response("Access denied", 403)

    company = Company.query.get(company_id)
    if not company:
        return error_response("Company not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("name", "address", "phone", "email", "gst_number", "is_active"):
        if field in data:
            setattr(company, field, data[field])

    db.session.commit()
    return success_response(data=company.to_dict(), message="Company updated")


@company_bp.route("/api/company/settings", methods=["GET"])
def get_settings():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    settings = CompanySettings.query.filter_by(company_id=company_id).all()
    data = {s.key: s.value for s in settings}
    return success_response(data=data)


@company_bp.route("/api/company/settings", methods=["PUT"])
@require_role("super_admin", "admin")
def update_settings():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for key, value in data.items():
        setting = CompanySettings.query.filter_by(
            company_id=company_id, key=key
        ).first()
        if setting:
            setting.value = str(value)
        else:
            setting = CompanySettings(
                company_id=company_id, key=key, value=str(value)
            )
            db.session.add(setting)

    db.session.commit()
    return success_response(message="Settings updated")


def create_app():
    app = create_service_app("company-service", import_models)
    app.register_blueprint(company_bp)
    return app
