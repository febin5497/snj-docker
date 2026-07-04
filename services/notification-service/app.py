import threading
from datetime import datetime
from flask import Blueprint, request
from shared import (
    create_service_app, db, success_response, error_response,
    get_current_user, get_current_user_claims,
    paginate_query, TimestampMixin, CompanyMixin,
    publish_event, subscribe_event,
)

notification_bp = Blueprint("notifications", __name__)


class Notification(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "notifications"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text)
    type = db.Column(db.String(50), default="info")
    related_model = db.Column(db.String(100))
    related_id = db.Column(db.Integer)
    is_read = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id, "user_id": self.user_id,
            "title": self.title, "message": self.message,
            "type": self.type, "related_model": self.related_model,
            "related_id": self.related_id, "is_read": self.is_read,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


def import_models():
    return Notification


def _handle_event(event_data):
    try:
        from flask import current_app
        with current_app.app_context():
            channel = event_data.get("channel", "")
            data = event_data.get("data", {})

            if not data.get("user_id"):
                return

            notification = Notification(
                user_id=data["user_id"],
                title=data.get("title", "New Event"),
                message=data.get("message", ""),
                type=data.get("type", "info"),
                related_model=data.get("related_model"),
                related_id=data.get("related_id"),
                company_id=data.get("company_id"),
            )
            db.session.add(notification)
            db.session.commit()
    except Exception:
        pass


def _start_event_listener():
    try:
        channels = [
            "project.created", "project.updated",
            "staff.created", "expense.submitted", "expense.approved",
            "attendance.marked",
            "invoice.created", "invoice.paid",
            "payroll.approved",
            "purchase.created", "purchase.approved",
            "vehicle.maintenance.due",
        ]
        for channel in channels:
            subscribe_event(channel, _handle_event)
    except Exception:
        pass


def create_app():
    app = create_service_app("notification-service", import_models)
    app.register_blueprint(notification_bp)

    with app.app_context():
        try:
            from shared.events import init_event_bus
            init_event_bus()
            listener_thread = threading.Thread(target=_start_event_listener, daemon=True)
            listener_thread.start()
        except Exception:
            pass

    return app


@notification_bp.route("/api/notifications", methods=["GET"])
def list_notifications():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    user_id = get_current_user()
    if not user_id:
        return error_response("Authentication required", 401)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    unread_only = request.args.get("unread_only", "false").lower() == "true"

    query = Notification.query.filter_by(user_id=user_id)
    if company_id:
        query = query.filter_by(company_id=company_id)
    if unread_only:
        query = query.filter_by(is_read=False)
    query = query.order_by(Notification.id.desc())

    pagination = paginate_query(query, page, per_page)

    unread_count = Notification.query.filter_by(
        user_id=user_id, is_read=False
    )
    if company_id:
        unread_count = unread_count.filter_by(company_id=company_id)
    unread_count = unread_count.count()

    result = pagination
    result["unread_count"] = unread_count
    return success_response(data=result)


@notification_bp.route("/api/notifications/<int:notification_id>/read", methods=["PUT"])
def mark_read(notification_id):
    claims = get_current_user_claims()
    user_id = get_current_user()
    if not user_id:
        return error_response("Authentication required", 401)

    notification = Notification.query.filter_by(
        id=notification_id, user_id=user_id
    ).first()
    if not notification:
        return error_response("Notification not found", 404)

    notification.is_read = True
    db.session.commit()
    return success_response(data=notification.to_dict(), message="Marked as read")


@notification_bp.route("/api/notifications/read-all", methods=["PUT"])
def mark_all_read():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    user_id = get_current_user()
    if not user_id:
        return error_response("Authentication required", 401)

    query = Notification.query.filter_by(user_id=user_id, is_read=False)
    if company_id:
        query = query.filter_by(company_id=company_id)

    count = query.update({"is_read": True})
    db.session.commit()
    return success_response(message=f"Marked {count} notifications as read")


@notification_bp.route("/api/notifications/<int:notification_id>", methods=["DELETE"])
def delete_notification(notification_id):
    claims = get_current_user_claims()
    user_id = get_current_user()
    if not user_id:
        return error_response("Authentication required", 401)

    notification = Notification.query.filter_by(
        id=notification_id, user_id=user_id
    ).first()
    if not notification:
        return error_response("Notification not found", 404)

    db.session.delete(notification)
    db.session.commit()
    return success_response(message="Notification deleted")
