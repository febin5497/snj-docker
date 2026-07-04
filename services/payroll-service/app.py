from datetime import datetime
from flask import Blueprint, request
from shared import (
    create_service_app, db, success_response, error_response,
    get_current_user, get_current_user_claims, require_role,
    paginate_query, TimestampMixin, CompanyMixin,
)

payroll_bp = Blueprint("payroll", __name__)


class PayrollCycle(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "payroll_cycles"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default="draft")
    approved_by = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "name": self.name,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status, "approved_by": self.approved_by,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class PayrollRecord(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "payroll_records"
    id = db.Column(db.Integer, primary_key=True)
    cycle_id = db.Column(db.Integer, db.ForeignKey("payroll_cycles.id"), nullable=False)
    staff_id = db.Column(db.Integer, nullable=False)
    basic_salary = db.Column(db.Float, nullable=False)
    allowances = db.Column(db.Float, default=0)
    deductions = db.Column(db.Float, default=0)
    net_pay = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default="pending")

    def to_dict(self):
        return {
            "id": self.id, "cycle_id": self.cycle_id,
            "staff_id": self.staff_id,
            "basic_salary": self.basic_salary,
            "allowances": self.allowances,
            "deductions": self.deductions,
            "net_pay": self.net_pay, "status": self.status,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


def import_models():
    return PayrollCycle, PayrollRecord


@payroll_bp.route("/api/payroll/cycles", methods=["GET"])
def list_cycles():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")

    query = PayrollCycle.query.filter_by(company_id=company_id)
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(PayrollCycle.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@payroll_bp.route("/api/payroll/cycles", methods=["POST"])
@require_role("super_admin", "admin")
def create_cycle():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    name = data.get("name", "").strip()
    start_date_str = data.get("start_date")
    end_date_str = data.get("end_date")
    if not name or not start_date_str or not end_date_str:
        return error_response("name, start_date, and end_date are required", 400)

    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    except ValueError:
        return error_response("Invalid date format", 400)

    cycle = PayrollCycle(
        name=name,
        start_date=start_date,
        end_date=end_date,
        status="draft",
        company_id=company_id,
    )
    db.session.add(cycle)
    db.session.commit()
    return success_response(data=cycle.to_dict(), message="Cycle created", status=201)


@payroll_bp.route("/api/payroll/cycles/<int:cycle_id>", methods=["GET"])
def get_cycle(cycle_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    cycle = PayrollCycle.query.filter_by(id=cycle_id, company_id=company_id).first()
    if not cycle:
        return error_response("Cycle not found", 404)

    return success_response(data=cycle.to_dict())


@payroll_bp.route("/api/payroll/cycles/<int:cycle_id>", methods=["PUT"])
@require_role("super_admin", "admin")
def update_cycle(cycle_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    cycle = PayrollCycle.query.filter_by(id=cycle_id, company_id=company_id).first()
    if not cycle:
        return error_response("Cycle not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("name", "status"):
        if field in data:
            setattr(cycle, field, data[field])

    if "start_date" in data:
        try:
            cycle.start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
        except ValueError:
            return error_response("Invalid date format", 400)
    if "end_date" in data:
        try:
            cycle.end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
        except ValueError:
            return error_response("Invalid date format", 400)

    db.session.commit()
    return success_response(data=cycle.to_dict(), message="Cycle updated")


@payroll_bp.route("/api/payroll/cycles/<int:cycle_id>/approve", methods=["POST"])
@require_role("super_admin", "admin")
def approve_cycle(cycle_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    cycle = PayrollCycle.query.filter_by(id=cycle_id, company_id=company_id).first()
    if not cycle:
        return error_response("Cycle not found", 404)

    if cycle.status == "approved":
        return error_response("Cycle already approved", 400)

    cycle.status = "approved"
    cycle.approved_by = get_current_user()

    records = PayrollRecord.query.filter_by(cycle_id=cycle_id, company_id=company_id).all()
    for rec in records:
        rec.status = "approved"

    db.session.commit()
    return success_response(data=cycle.to_dict(), message="Cycle approved")


@payroll_bp.route("/api/payroll/records", methods=["GET"])
def list_records():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    cycle_id = request.args.get("cycle_id", type=int)
    staff_id = request.args.get("staff_id", type=int)
    status = request.args.get("status")

    query = PayrollRecord.query.filter_by(company_id=company_id)
    if cycle_id:
        query = query.filter_by(cycle_id=cycle_id)
    if staff_id:
        query = query.filter_by(staff_id=staff_id)
    if status:
        query = query.filter_by(status=status)

    query = query.order_by(PayrollRecord.id.desc())
    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@payroll_bp.route("/api/payroll/records", methods=["POST"])
@require_role("super_admin", "admin")
def create_record():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    cycle_id = data.get("cycle_id")
    staff_id = data.get("staff_id")
    basic_salary = data.get("basic_salary")
    if not cycle_id or not staff_id or basic_salary is None:
        return error_response("cycle_id, staff_id, and basic_salary are required", 400)

    cycle = PayrollCycle.query.filter_by(id=cycle_id, company_id=company_id).first()
    if not cycle:
        return error_response("Cycle not found", 404)

    allowances = float(data.get("allowances", 0))
    deductions = float(data.get("deductions", 0))
    net_pay = float(basic_salary) + allowances - deductions

    record = PayrollRecord(
        cycle_id=cycle_id,
        staff_id=staff_id,
        basic_salary=float(basic_salary),
        allowances=allowances,
        deductions=deductions,
        net_pay=net_pay,
        status="pending",
        company_id=company_id,
    )
    db.session.add(record)
    db.session.commit()
    return success_response(data=record.to_dict(), message="Record created", status=201)


@payroll_bp.route("/api/payroll/records/<int:record_id>", methods=["PUT"])
@require_role("super_admin", "admin")
def update_record(record_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    record = PayrollRecord.query.filter_by(id=record_id, company_id=company_id).first()
    if not record:
        return error_response("Record not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("basic_salary", "allowances", "deductions", "status"):
        if field in data:
            setattr(record, field, data[field])

    if any(f in data for f in ("basic_salary", "allowances", "deductions")):
        record.net_pay = record.basic_salary + record.allowances - record.deductions

    db.session.commit()
    return success_response(data=record.to_dict(), message="Record updated")


def create_app():
    app = create_service_app("payroll-service", import_models)
    app.register_blueprint(payroll_bp)
    return app
