from datetime import datetime
from flask import Blueprint, request, Response
from shared import (
    create_service_app, db, success_response, error_response,
    get_current_user, get_current_user_claims, require_role,
    paginate_query, TimestampMixin, CompanyMixin,
)

attendance_bp = Blueprint("attendance", __name__)


class Attendance(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "attendances"
    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, nullable=False)
    project_id = db.Column(db.Integer, nullable=True)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="present")
    check_in = db.Column(db.DateTime)
    check_out = db.Column(db.DateTime)
    approved_by = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "staff_id": self.staff_id,
            "project_id": self.project_id, "date": self.date.isoformat() if self.date else None,
            "status": self.status,
            "check_in": self.check_in.isoformat() if self.check_in else None,
            "check_out": self.check_out.isoformat() if self.check_out else None,
            "approved_by": self.approved_by,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class AttendanceRecord(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "attendance_records"
    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, nullable=False)
    project_id = db.Column(db.Integer, nullable=True)
    date = db.Column(db.Date, nullable=False)
    check_in_time = db.Column(db.DateTime)
    check_out_time = db.Column(db.DateTime)
    hours_worked = db.Column(db.Float, default=0)

    def to_dict(self):
        return {
            "id": self.id, "staff_id": self.staff_id,
            "project_id": self.project_id, "date": self.date.isoformat() if self.date else None,
            "check_in_time": self.check_in_time.isoformat() if self.check_in_time else None,
            "check_out_time": self.check_out_time.isoformat() if self.check_out_time else None,
            "hours_worked": self.hours_worked,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class AttendancePhoto(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "attendance_photos"
    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, nullable=False)
    project_id = db.Column(db.Integer, nullable=True)
    photo_data = db.Column(db.LargeBinary, nullable=False)
    photo_filename = db.Column(db.String(255), default="photo.jpg")
    approval_status = db.Column(db.String(20), default="pending")
    approved_by = db.Column(db.Integer, nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    rejected_by = db.Column(db.Integer, nullable=True)
    rejected_at = db.Column(db.DateTime, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    timestamp_captured = db.Column(db.DateTime, nullable=True)
    timestamp_submitted = db.Column(db.DateTime, default=datetime.utcnow)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    location_accuracy = db.Column(db.Float, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "staff_id": self.staff_id,
            "staff_name": None,
            "staff_role": None,
            "project_id": self.project_id,
            "approval_status": self.approval_status,
            "approved_by": self.approved_by,
            "approved_at": self.approved_at.isoformat() if self.approved_at else None,
            "rejected_by": self.rejected_by,
            "rejected_at": self.rejected_at.isoformat() if self.rejected_at else None,
            "rejection_reason": self.rejection_reason,
            "timestamp_captured": self.timestamp_captured.isoformat() if self.timestamp_captured else None,
            "timestamp_submitted": self.timestamp_submitted.isoformat() if self.timestamp_submitted else None,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "location_accuracy": self.location_accuracy,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


def import_models():
    return Attendance, AttendanceRecord, AttendancePhoto


@attendance_bp.route("/api/attendance", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def mark_attendance():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    staff_id = data.get("staff_id")
    date_str = data.get("date")
    status = data.get("status", "present")

    if not staff_id or not date_str:
        return error_response("Staff ID and date are required", 400)

    try:
        att_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return error_response("Invalid date format", 400)

    existing = Attendance.query.filter_by(
        staff_id=staff_id, date=att_date, company_id=company_id
    ).first()
    if existing:
        return error_response("Attendance already marked for this date", 409)

    check_in = None
    check_out = None
    if data.get("check_in"):
        try:
            check_in = datetime.fromisoformat(data["check_in"])
        except ValueError:
            pass
    if data.get("check_out"):
        try:
            check_out = datetime.fromisoformat(data["check_out"])
        except ValueError:
            pass

    attendance = Attendance(
        staff_id=staff_id,
        project_id=data.get("project_id"),
        date=att_date,
        status=status,
        check_in=check_in,
        check_out=check_out,
        company_id=company_id,
    )
    db.session.add(attendance)
    db.session.flush()

    hours = 0
    if check_in and check_out:
        hours = (check_out - check_in).total_seconds() / 3600

    record = AttendanceRecord(
        staff_id=staff_id,
        project_id=data.get("project_id"),
        date=att_date,
        check_in_time=check_in,
        check_out_time=check_out,
        hours_worked=round(hours, 2),
        company_id=company_id,
    )
    db.session.add(record)
    db.session.commit()

    return success_response(data=attendance.to_dict(), message="Attendance marked", status=201)


@attendance_bp.route("/api/attendance", methods=["GET"])
def list_attendance():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    staff_id = request.args.get("staff_id", type=int)
    project_id = request.args.get("project_id", type=int)
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    status = request.args.get("status")

    query = Attendance.query.filter_by(company_id=company_id)
    if staff_id:
        query = query.filter_by(staff_id=staff_id)
    if project_id:
        query = query.filter_by(project_id=project_id)
    if status:
        query = query.filter_by(status=status)
    if start_date:
        try:
            query = query.filter(Attendance.date >= datetime.strptime(start_date, "%Y-%m-%d").date())
        except ValueError:
            pass
    if end_date:
        try:
            query = query.filter(Attendance.date <= datetime.strptime(end_date, "%Y-%m-%d").date())
        except ValueError:
            pass

    query = query.order_by(Attendance.date.desc(), Attendance.id.desc())
    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@attendance_bp.route("/api/attendance/report", methods=["GET"])
def attendance_report():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    project_id = request.args.get("project_id", type=int)

    query = db.session.query(
        Attendance.staff_id,
        db.func.count(Attendance.id).label("total_days"),
        db.func.count(db.case((Attendance.status == "present", 1))).label("present"),
        db.func.count(db.case((Attendance.status == "absent", 1))).label("absent"),
        db.func.count(db.case((Attendance.status == "leave", 1))).label("leave"),
    ).filter(Attendance.company_id == company_id)

    if start_date:
        try:
            query = query.filter(Attendance.date >= datetime.strptime(start_date, "%Y-%m-%d").date())
        except ValueError:
            pass
    if end_date:
        try:
            query = query.filter(Attendance.date <= datetime.strptime(end_date, "%Y-%m-%d").date())
        except ValueError:
            pass
    if project_id:
        query = query.filter(Attendance.project_id == project_id)

    results = query.group_by(Attendance.staff_id).all()

    report = []
    for r in results:
        report.append({
            "staff_id": r.staff_id,
            "total_days": r.total_days,
            "present": r.present,
            "absent": r.absent,
            "leave": r.leave,
        })

    return success_response(data=report)


@attendance_bp.route("/api/attendance/bulk", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def bulk_attendance():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data or "records" not in data:
        return error_response("Records array is required", 400)

    records = data["records"]
    created = []
    errors = []

    for i, rec in enumerate(records):
        staff_id = rec.get("staff_id")
        date_str = rec.get("date")
        status = rec.get("status", "present")

        if not staff_id or not date_str:
            errors.append({"index": i, "error": "staff_id and date required"})
            continue

        try:
            att_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            errors.append({"index": i, "error": "invalid date format"})
            continue

        existing = Attendance.query.filter_by(
            staff_id=staff_id, date=att_date, company_id=company_id
        ).first()
        if existing:
            errors.append({"index": i, "error": "attendance already exists"})
            continue

        check_in = None
        check_out = None
        if rec.get("check_in"):
            try:
                check_in = datetime.fromisoformat(rec["check_in"])
            except ValueError:
                pass
        if rec.get("check_out"):
            try:
                check_out = datetime.fromisoformat(rec["check_out"])
            except ValueError:
                pass

        attendance = Attendance(
            staff_id=staff_id,
            project_id=rec.get("project_id"),
            date=att_date,
            status=status,
            check_in=check_in,
            check_out=check_out,
            company_id=company_id,
        )
        db.session.add(attendance)
        created.append(staff_id)

    db.session.commit()
    return success_response(
        data={"created": len(created), "errors": errors},
        message=f"Created {len(created)} records",
    )


@attendance_bp.route("/api/attendance/unified", methods=["GET"])
def unified_attendance():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    staff_id = request.args.get("staff_id", type=int)

    query = AttendanceRecord.query.filter_by(company_id=company_id)
    if staff_id:
        query = query.filter_by(staff_id=staff_id)
    if start_date:
        try:
            query = query.filter(AttendanceRecord.date >= datetime.strptime(start_date, "%Y-%m-%d").date())
        except ValueError:
            pass
    if end_date:
        try:
            query = query.filter(AttendanceRecord.date <= datetime.strptime(end_date, "%Y-%m-%d").date())
        except ValueError:
            pass

    records = query.order_by(AttendanceRecord.date.desc()).limit(500).all()
    return success_response(data=[r.to_dict() for r in records])


@attendance_bp.route("/api/attendance/photos/upload", methods=["POST"])
@require_role("super_admin", "admin", "manager", "staff")
def upload_photo():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    user_id = get_current_user()

    if "photo" not in request.files:
        return error_response("No photo file provided", 400)

    photo_file = request.files["photo"]
    if not photo_file.filename:
        return error_response("Empty filename", 400)

    photo_data = photo_file.read()
    if len(photo_data) == 0:
        return error_response("Empty photo data", 400)

    staff_id = request.form.get("staff_id", type=int) or user_id
    project_id = request.form.get("project_id", type=int)
    latitude = request.form.get("latitude", type=float)
    longitude = request.form.get("longitude", type=float)
    accuracy = request.form.get("location_accuracy", type=float)

    captured_str = request.form.get("timestamp_captured")
    captured = None
    if captured_str:
        try:
            captured = datetime.fromisoformat(captured_str)
        except ValueError:
            pass

    photo = AttendancePhoto(
        staff_id=staff_id,
        project_id=project_id,
        photo_data=photo_data,
        photo_filename=photo_file.filename,
        timestamp_captured=captured or datetime.utcnow(),
        timestamp_submitted=datetime.utcnow(),
        latitude=latitude,
        longitude=longitude,
        location_accuracy=accuracy,
        company_id=company_id,
    )
    db.session.add(photo)
    db.session.commit()

    return success_response(data=photo.to_dict(), message="Photo uploaded", status=201)


@attendance_bp.route("/api/attendance/photos/<int:photo_id>", methods=["GET"])
def serve_photo(photo_id):
    photo = AttendancePhoto.query.get(photo_id)
    if not photo:
        return error_response("Photo not found", 404)

    return Response(
        photo.photo_data,
        mimetype="image/jpeg",
        headers={"Content-Disposition": f"inline; filename={photo.photo_filename}"},
    )


@attendance_bp.route("/api/attendance/approvals/pending", methods=["GET"])
def list_approval_photos():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    status_filter = request.args.get("status", "pending")

    query = AttendancePhoto.query.filter_by(company_id=company_id)
    if status_filter and status_filter != "all":
        query = query.filter_by(approval_status=status_filter)

    photos = query.order_by(AttendancePhoto.created_at.desc()).limit(200).all()

    result = []
    for p in photos:
        d = p.to_dict()
        d["staff_name"] = f"Staff {p.staff_id}"
        d["staff_role"] = "staff"
        result.append(d)

    return success_response(data=result)


@attendance_bp.route("/api/attendance/approvals/<int:photo_id>/approve", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def approve_photo(photo_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    user_id = get_current_user()

    photo = AttendancePhoto.query.filter_by(id=photo_id, company_id=company_id).first()
    if not photo:
        return error_response("Photo not found", 404)

    if photo.approval_status == "approved":
        return error_response("Photo already approved", 400)

    photo.approval_status = "approved"
    photo.approved_by = user_id
    photo.approved_at = datetime.utcnow()
    db.session.commit()

    return success_response(data=photo.to_dict(), message="Photo approved")


@attendance_bp.route("/api/attendance/approvals/<int:photo_id>/reject", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def reject_photo(photo_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    user_id = get_current_user()
    data = request.get_json(silent=True) or {}

    photo = AttendancePhoto.query.filter_by(id=photo_id, company_id=company_id).first()
    if not photo:
        return error_response("Photo not found", 404)

    if photo.approval_status == "rejected":
        return error_response("Photo already rejected", 400)

    reason = data.get("rejection_reason", "")
    if not reason or not reason.strip():
        return error_response("Rejection reason is required", 400)

    photo.approval_status = "rejected"
    photo.rejected_by = user_id
    photo.rejected_at = datetime.utcnow()
    photo.rejection_reason = reason.strip()
    db.session.commit()

    return success_response(data=photo.to_dict(), message="Photo rejected")


def create_app():
    app = create_service_app("attendance-service", import_models)
    app.register_blueprint(attendance_bp)
    return app
