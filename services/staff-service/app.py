import bcrypt
from datetime import datetime
from flask import Blueprint, request
from shared import (
    create_service_app, db, success_response, error_response,
    get_current_user, get_current_user_claims, require_role,
    paginate_query, TimestampMixin, CompanyMixin,
)

staff_bp = Blueprint("staff", __name__)


class Staff(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "staff"
    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.String(50), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    personal_phone = db.Column(db.String(20))
    designation = db.Column(db.String(100))
    department = db.Column(db.String(100))
    role = db.Column(db.String(50), default="staff")
    salary = db.Column(db.Float, default=0)
    monthly_salary = db.Column(db.Float, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    status = db.Column(db.String(20), default="active")
    joining_date = db.Column(db.Date)

    def to_dict(self):
        return {
            "id": self.id,
            "staff_id": self.staff_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "phone": self.phone,
            "personal_phone": self.personal_phone,
            "designation": self.designation,
            "department": self.department,
            "role": self.role,
            "salary": self.salary,
            "monthly_salary": self.monthly_salary,
            "user_id": self.user_id,
            "company_id": self.company_id,
            "status": self.status,
            "joining_date": self.joining_date.isoformat() if self.joining_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Expense(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "expenses"
    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey("staff.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100))
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default="pending")
    project_id = db.Column(db.Integer, nullable=True)
    receipt_url = db.Column(db.String(500))

    def to_dict(self):
        return {
            "id": self.id,
            "staff_id": self.staff_id,
            "amount": self.amount,
            "category": self.category,
            "description": self.description,
            "status": self.status,
            "project_id": self.project_id,
            "company_id": self.company_id,
            "receipt_url": self.receipt_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


def import_models():
    return Staff, Expense


def _create_user_for_staff(first_name, last_name, company_id):
    from shared.auth import generate_tokens

    username = f"{first_name.lower()}.{last_name.lower()}" if last_name else first_name.lower()
    base_username = username
    counter = 1
    while _user_exists(username):
        username = f"{base_username}{counter}"
        counter += 1

    password_hash = bcrypt.hashpw(
        "changeme123".encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    from shared import db as _db
    _db.session.execute(
        _db.text(
            "INSERT INTO users (username, password_hash, role, company_id, password_change_required, is_active, created_at, updated_at) "
            "VALUES (:username, :password_hash, :role, :company_id, :pcr, :active, :now, :now)"
        ),
        {
            "username": username,
            "password_hash": password_hash,
            "role": "staff",
            "company_id": company_id,
            "pcr": True,
            "active": True,
            "now": datetime.utcnow(),
        },
    )
    result = _db.session.execute(
        _db.text("SELECT id FROM users WHERE username = :username"),
        {"username": username},
    )
    row = result.fetchone()
    return row[0] if row else None


def _user_exists(username):
    from shared import db as _db
    result = _db.session.execute(
        _db.text("SELECT 1 FROM users WHERE username = :username"),
        {"username": username},
    )
    return result.fetchone() is not None


@staff_bp.route("/api/staff", methods=["GET"])
def list_staff():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")
    search = request.args.get("search", "").strip()
    department = request.args.get("department")

    query = Staff.query.filter_by(company_id=company_id)
    if status:
        query = query.filter_by(status=status)
    if department:
        query = query.filter_by(department=department)
    if search:
        query = query.filter(
            db.or_(
                Staff.first_name.ilike(f"%{search}%"),
                Staff.last_name.ilike(f"%{search}%"),
                Staff.staff_id.ilike(f"%{search}%"),
            )
        )

    query = query.order_by(Staff.id.desc())
    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@staff_bp.route("/api/staff", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_staff():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    first_name = data.get("first_name", "").strip()
    staff_id_val = data.get("staff_id", "").strip()
    if not first_name or not staff_id_val:
        return error_response("First name and staff_id are required", 400)

    if Staff.query.filter_by(staff_id=staff_id_val, company_id=company_id).first():
        return error_response("Staff ID already exists", 409)

    joining_date = None
    if data.get("joining_date"):
        try:
            joining_date = datetime.strptime(data["joining_date"], "%Y-%m-%d").date()
        except ValueError:
            return error_response("Invalid date format. Use YYYY-MM-DD", 400)

    staff = Staff(
        staff_id=staff_id_val,
        first_name=first_name,
        last_name=data.get("last_name", ""),
        phone=data.get("phone", ""),
        personal_phone=data.get("personal_phone", ""),
        designation=data.get("designation", ""),
        department=data.get("department", ""),
        role=data.get("role", "staff"),
        salary=data.get("salary", 0),
        monthly_salary=data.get("monthly_salary", 0),
        company_id=company_id,
        status="active",
        joining_date=joining_date,
    )
    db.session.add(staff)
    db.session.flush()

    if data.get("create_user", True):
        user_id = _create_user_for_staff(first_name, data.get("last_name", ""), company_id)
        staff.user_id = user_id

    db.session.commit()
    return success_response(data=staff.to_dict(), message="Staff created", status=201)


@staff_bp.route("/api/staff/<int:staff_id>", methods=["GET"])
def get_staff(staff_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    staff = Staff.query.filter_by(id=staff_id, company_id=company_id).first()
    if not staff:
        return error_response("Staff not found", 404)

    return success_response(data=staff.to_dict())


@staff_bp.route("/api/staff/<int:staff_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_staff(staff_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    staff = Staff.query.filter_by(id=staff_id, company_id=company_id).first()
    if not staff:
        return error_response("Staff not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    updatable = (
        "first_name", "last_name", "phone", "personal_phone", "designation",
        "department", "role", "salary", "monthly_salary", "status",
    )
    for field in updatable:
        if field in data:
            setattr(staff, field, data[field])

    if "joining_date" in data and data["joining_date"]:
        try:
            staff.joining_date = datetime.strptime(data["joining_date"], "%Y-%m-%d").date()
        except ValueError:
            return error_response("Invalid date format", 400)

    db.session.commit()
    return success_response(data=staff.to_dict(), message="Staff updated")


@staff_bp.route("/api/staff/<int:staff_id>", methods=["DELETE"])
@require_role("super_admin", "admin")
def delete_staff(staff_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    staff = Staff.query.filter_by(id=staff_id, company_id=company_id).first()
    if not staff:
        return error_response("Staff not found", 404)

    staff.status = "inactive"
    db.session.commit()
    return success_response(message="Staff deactivated")


@staff_bp.route("/api/staff/expenses", methods=["GET"])
def list_expenses():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")
    staff_filter = request.args.get("staff_id", type=int)

    query = Expense.query.filter_by(company_id=company_id)
    if status:
        query = query.filter_by(status=status)
    if staff_filter:
        query = query.filter_by(staff_id=staff_filter)

    query = query.order_by(Expense.id.desc())
    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@staff_bp.route("/api/staff/expenses", methods=["POST"])
@require_role("super_admin", "admin", "manager", "staff")
def create_expense():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    staff_id_val = data.get("staff_id")
    amount = data.get("amount")
    if not staff_id_val or amount is None:
        return error_response("Staff ID and amount are required", 400)

    expense = Expense(
        staff_id=staff_id_val,
        amount=float(amount),
        category=data.get("category", ""),
        description=data.get("description", ""),
        status="pending",
        project_id=data.get("project_id"),
        company_id=company_id,
        receipt_url=data.get("receipt_url"),
    )
    db.session.add(expense)
    db.session.commit()

    return success_response(data=expense.to_dict(), message="Expense created", status=201)


@staff_bp.route("/api/staff/expenses/<int:expense_id>/approve", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def approve_expense(expense_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    expense = Expense.query.filter_by(id=expense_id, company_id=company_id).first()
    if not expense:
        return error_response("Expense not found", 404)

    if expense.status != "pending":
        return error_response("Expense is not pending", 400)

    expense.status = "approved"
    db.session.commit()
    return success_response(data=expense.to_dict(), message="Expense approved")


@staff_bp.route("/api/staff/expenses/<int:expense_id>/reject", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def reject_expense(expense_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    expense = Expense.query.filter_by(id=expense_id, company_id=company_id).first()
    if not expense:
        return error_response("Expense not found", 404)

    if expense.status != "pending":
        return error_response("Expense is not pending", 400)

    expense.status = "rejected"
    db.session.commit()
    return success_response(data=expense.to_dict(), message="Expense rejected")


@staff_bp.route("/api/staff/mobile/expenses", methods=["GET"])
def mobile_expenses():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    user_id = get_current_user()

    staff = Staff.query.filter_by(user_id=user_id, company_id=company_id).first()
    if not staff:
        return error_response("Staff profile not found", 404)

    expenses = Expense.query.filter_by(
        staff_id=staff.id, company_id=company_id
    ).order_by(Expense.id.desc()).limit(50).all()

    return success_response(data=[e.to_dict() for e in expenses])


def create_app():
    app = create_service_app("staff-service", import_models)
    app.register_blueprint(staff_bp)
    return app
