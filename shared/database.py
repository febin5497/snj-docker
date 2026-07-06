import os
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class TimestampMixin:
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CompanyMixin:
    company_id = db.Column(db.Integer, db.ForeignKey("companies.id"), nullable=False)


class AuditMixin(TimestampMixin, CompanyMixin):
    created_by_id = db.Column(db.Integer, nullable=True)
    updated_by_id = db.Column(db.Integer, nullable=True)


class Company(db.Model):
    __tablename__ = "companies"
    __table_args__ = {"extend_existing": True}
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200))


def init_db(app):
    db_url = os.getenv("DATABASE_URL", "postgresql://erp_user:erp_password@db:5432/construction_erp")
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_size": 5,
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    db.init_app(app)
    return db
