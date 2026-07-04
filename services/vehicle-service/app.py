from datetime import datetime
from flask import Blueprint, request
from shared import (
    create_service_app, db, success_response, error_response,
    get_current_user, get_current_user_claims, require_role,
    paginate_query, TimestampMixin, CompanyMixin,
)

vehicle_bp = Blueprint("vehicles", __name__)


class Vehicle(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "vehicles"
    id = db.Column(db.Integer, primary_key=True)
    make = db.Column(db.String(100), nullable=False)
    model = db.Column(db.String(100))
    year = db.Column(db.Integer)
    registration_number = db.Column(db.String(50), unique=True)
    type = db.Column(db.String(50))
    status = db.Column(db.String(20), default="active")

    def to_dict(self):
        return {
            "id": self.id, "make": self.make, "model": self.model,
            "year": self.year,
            "registration_number": self.registration_number,
            "type": self.type, "status": self.status,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class FuelLog(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "fuel_logs"
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey("vehicles.id"), nullable=False)
    date = db.Column(db.Date, nullable=False)
    liters = db.Column(db.Float, nullable=False)
    amount = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            "id": self.id, "vehicle_id": self.vehicle_id,
            "date": self.date.isoformat() if self.date else None,
            "liters": self.liters, "amount": self.amount,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class MaintenanceLog(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "maintenance_logs"
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey("vehicles.id"), nullable=False)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.Text)
    cost = db.Column(db.Float, default=0)
    status = db.Column(db.String(20), default="pending")

    def to_dict(self):
        return {
            "id": self.id, "vehicle_id": self.vehicle_id,
            "date": self.date.isoformat() if self.date else None,
            "description": self.description,
            "cost": self.cost, "status": self.status,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class DriverVehicleAssignment(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "driver_vehicle_assignments"
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey("vehicles.id"), nullable=False)
    staff_id = db.Column(db.Integer, nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)

    def to_dict(self):
        return {
            "id": self.id, "vehicle_id": self.vehicle_id,
            "staff_id": self.staff_id,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


def import_models():
    return Vehicle, FuelLog, MaintenanceLog, DriverVehicleAssignment


@vehicle_bp.route("/api/vehicles", methods=["GET"])
def list_vehicles():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")
    search = request.args.get("search", "").strip()

    query = Vehicle.query.filter_by(company_id=company_id)
    if status:
        query = query.filter_by(status=status)
    if search:
        query = query.filter(
            db.or_(
                Vehicle.make.ilike(f"%{search}%"),
                Vehicle.registration_number.ilike(f"%{search}%"),
            )
        )
    query = query.order_by(Vehicle.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@vehicle_bp.route("/api/vehicles", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_vehicle():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    make = data.get("make", "").strip()
    reg = data.get("registration_number", "").strip()
    if not make or not reg:
        return error_response("Make and registration_number are required", 400)

    if Vehicle.query.filter_by(registration_number=reg, company_id=company_id).first():
        return error_response("Registration number already exists", 409)

    vehicle = Vehicle(
        make=make,
        model=data.get("model", ""),
        year=data.get("year"),
        registration_number=reg,
        type=data.get("type", ""),
        status="active",
        company_id=company_id,
    )
    db.session.add(vehicle)
    db.session.commit()
    return success_response(data=vehicle.to_dict(), message="Vehicle created", status=201)


@vehicle_bp.route("/api/vehicles/<int:vehicle_id>", methods=["GET"])
def get_vehicle(vehicle_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    vehicle = Vehicle.query.filter_by(id=vehicle_id, company_id=company_id).first()
    if not vehicle:
        return error_response("Vehicle not found", 404)
    return success_response(data=vehicle.to_dict())


@vehicle_bp.route("/api/vehicles/<int:vehicle_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_vehicle(vehicle_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    vehicle = Vehicle.query.filter_by(id=vehicle_id, company_id=company_id).first()
    if not vehicle:
        return error_response("Vehicle not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("make", "model", "year", "registration_number", "type", "status"):
        if field in data:
            setattr(vehicle, field, data[field])

    db.session.commit()
    return success_response(data=vehicle.to_dict(), message="Vehicle updated")


@vehicle_bp.route("/api/vehicles/<int:vehicle_id>", methods=["DELETE"])
@require_role("super_admin", "admin")
def delete_vehicle(vehicle_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    vehicle = Vehicle.query.filter_by(id=vehicle_id, company_id=company_id).first()
    if not vehicle:
        return error_response("Vehicle not found", 404)
    vehicle.status = "inactive"
    db.session.commit()
    return success_response(message="Vehicle deactivated")


@vehicle_bp.route("/api/vehicles/fuel", methods=["GET"])
def list_fuel_logs():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    vehicle_id = request.args.get("vehicle_id", type=int)

    query = FuelLog.query.filter_by(company_id=company_id)
    if vehicle_id:
        query = query.filter_by(vehicle_id=vehicle_id)
    query = query.order_by(FuelLog.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@vehicle_bp.route("/api/vehicles/fuel", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_fuel_log():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    vehicle_id = data.get("vehicle_id")
    date_str = data.get("date")
    liters = data.get("liters")
    amount = data.get("amount")
    if not vehicle_id or not date_str or liters is None or amount is None:
        return error_response("vehicle_id, date, liters, and amount are required", 400)

    try:
        log_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return error_response("Invalid date format", 400)

    log = FuelLog(
        vehicle_id=vehicle_id,
        date=log_date,
        liters=float(liters),
        amount=float(amount),
        company_id=company_id,
    )
    db.session.add(log)
    db.session.commit()
    return success_response(data=log.to_dict(), message="Fuel log created", status=201)


@vehicle_bp.route("/api/vehicles/maintenance", methods=["GET"])
def list_maintenance_logs():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    vehicle_id = request.args.get("vehicle_id", type=int)
    status = request.args.get("status")

    query = MaintenanceLog.query.filter_by(company_id=company_id)
    if vehicle_id:
        query = query.filter_by(vehicle_id=vehicle_id)
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(MaintenanceLog.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@vehicle_bp.route("/api/vehicles/maintenance", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_maintenance_log():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    vehicle_id = data.get("vehicle_id")
    date_str = data.get("date")
    if not vehicle_id or not date_str:
        return error_response("vehicle_id and date are required", 400)

    try:
        log_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return error_response("Invalid date format", 400)

    log = MaintenanceLog(
        vehicle_id=vehicle_id,
        date=log_date,
        description=data.get("description", ""),
        cost=float(data.get("cost", 0)),
        status=data.get("status", "pending"),
        company_id=company_id,
    )
    db.session.add(log)
    db.session.commit()
    return success_response(data=log.to_dict(), message="Maintenance log created", status=201)


@vehicle_bp.route("/api/vehicles/maintenance/<int:log_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_maintenance_log(log_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    log = MaintenanceLog.query.filter_by(id=log_id, company_id=company_id).first()
    if not log:
        return error_response("Maintenance log not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("description", "cost", "status"):
        if field in data:
            setattr(log, field, data[field])

    if "date" in data:
        try:
            log.date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except ValueError:
            return error_response("Invalid date format", 400)

    db.session.commit()
    return success_response(data=log.to_dict(), message="Maintenance log updated")


@vehicle_bp.route("/api/vehicles/assignments", methods=["GET"])
def list_assignments():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    vehicle_id = request.args.get("vehicle_id", type=int)

    query = DriverVehicleAssignment.query.filter_by(company_id=company_id)
    if vehicle_id:
        query = query.filter_by(vehicle_id=vehicle_id)
    query = query.order_by(DriverVehicleAssignment.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@vehicle_bp.route("/api/vehicles/assignments", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_assignment():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    vehicle_id = data.get("vehicle_id")
    staff_id = data.get("staff_id")
    start_date_str = data.get("start_date")
    if not vehicle_id or not staff_id or not start_date_str:
        return error_response("vehicle_id, staff_id, and start_date are required", 400)

    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    except ValueError:
        return error_response("Invalid date format", 400)

    end_date = None
    if data.get("end_date"):
        try:
            end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
        except ValueError:
            return error_response("Invalid date format", 400)

    assignment = DriverVehicleAssignment(
        vehicle_id=vehicle_id,
        staff_id=staff_id,
        start_date=start_date,
        end_date=end_date,
        company_id=company_id,
    )
    db.session.add(assignment)
    db.session.commit()
    return success_response(data=assignment.to_dict(), message="Assignment created", status=201)


@vehicle_bp.route("/api/vehicles/assignments/<int:assignment_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_assignment(assignment_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    assignment = DriverVehicleAssignment.query.filter_by(
        id=assignment_id, company_id=company_id
    ).first()
    if not assignment:
        return error_response("Assignment not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("vehicle_id", "staff_id"):
        if field in data:
            setattr(assignment, field, data[field])

    if "start_date" in data:
        try:
            assignment.start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
        except ValueError:
            return error_response("Invalid date format", 400)
    if "end_date" in data:
        try:
            assignment.end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
        except ValueError:
            return error_response("Invalid date format", 400)

    db.session.commit()
    return success_response(data=assignment.to_dict(), message="Assignment updated")


def create_app():
    app = create_service_app("vehicle-service", import_models)
    app.register_blueprint(vehicle_bp)
    return app
