from datetime import datetime
from flask import Blueprint, request
from shared import (
    create_service_app, db, success_response, error_response,
    get_current_user, get_current_user_claims, require_role,
    paginate_query, TimestampMixin, CompanyMixin,
)

procurement_bp = Blueprint("procurement", __name__)


class Supplier(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "suppliers"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    address = db.Column(db.Text)
    gst_number = db.Column(db.String(20))

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "phone": self.phone,
            "email": self.email, "address": self.address,
            "gst_number": self.gst_number, "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Purchase(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "purchases"
    id = db.Column(db.Integer, primary_key=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey("suppliers.id"), nullable=True)
    project_id = db.Column(db.Integer, nullable=True)
    total_amount = db.Column(db.Float, default=0)
    status = db.Column(db.String(20), default="draft")

    def to_dict(self):
        return {
            "id": self.id, "supplier_id": self.supplier_id,
            "project_id": self.project_id,
            "total_amount": self.total_amount, "status": self.status,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class PurchaseItem(db.Model, TimestampMixin):
    __tablename__ = "purchase_items"
    id = db.Column(db.Integer, primary_key=True)
    purchase_id = db.Column(db.Integer, db.ForeignKey("purchases.id"), nullable=False)
    material_name = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            "id": self.id, "purchase_id": self.purchase_id,
            "material_name": self.material_name,
            "quantity": self.quantity, "unit_price": self.unit_price,
            "total": self.total,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class PurchaseIndent(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "purchase_indents"
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(20), default="pending")

    def to_dict(self):
        return {
            "id": self.id, "project_id": self.project_id,
            "status": self.status, "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class GRN(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "grns"
    id = db.Column(db.Integer, primary_key=True)
    purchase_id = db.Column(db.Integer, db.ForeignKey("purchases.id"), nullable=True)
    received_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default="pending")

    def to_dict(self):
        return {
            "id": self.id, "purchase_id": self.purchase_id,
            "received_date": self.received_date.isoformat() if self.received_date else None,
            "status": self.status, "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


def import_models():
    return Supplier, Purchase, PurchaseItem, PurchaseIndent, GRN


@procurement_bp.route("/api/suppliers", methods=["GET"])
def list_suppliers():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    search = request.args.get("search", "").strip()

    query = Supplier.query.filter_by(company_id=company_id)
    if search:
        query = query.filter(Supplier.name.ilike(f"%{search}%"))
    query = query.order_by(Supplier.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@procurement_bp.route("/api/suppliers", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_supplier():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    name = data.get("name", "").strip()
    if not name:
        return error_response("Supplier name is required", 400)

    supplier = Supplier(
        name=name, phone=data.get("phone", ""),
        email=data.get("email", ""), address=data.get("address", ""),
        gst_number=data.get("gst_number", ""),
        company_id=company_id,
    )
    db.session.add(supplier)
    db.session.commit()
    return success_response(data=supplier.to_dict(), message="Supplier created", status=201)


@procurement_bp.route("/api/suppliers/<int:supplier_id>", methods=["GET"])
def get_supplier(supplier_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    supplier = Supplier.query.filter_by(id=supplier_id, company_id=company_id).first()
    if not supplier:
        return error_response("Supplier not found", 404)
    return success_response(data=supplier.to_dict())


@procurement_bp.route("/api/suppliers/<int:supplier_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_supplier(supplier_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    supplier = Supplier.query.filter_by(id=supplier_id, company_id=company_id).first()
    if not supplier:
        return error_response("Supplier not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("name", "phone", "email", "address", "gst_number"):
        if field in data:
            setattr(supplier, field, data[field])

    db.session.commit()
    return success_response(data=supplier.to_dict(), message="Supplier updated")


@procurement_bp.route("/api/purchases", methods=["GET"])
def list_purchases():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")
    project_id = request.args.get("project_id", type=int)

    query = Purchase.query.filter_by(company_id=company_id)
    if status:
        query = query.filter_by(status=status)
    if project_id:
        query = query.filter_by(project_id=project_id)
    query = query.order_by(Purchase.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@procurement_bp.route("/api/purchases", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_purchase():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    purchase = Purchase(
        supplier_id=data.get("supplier_id"),
        project_id=data.get("project_id"),
        total_amount=data.get("total_amount", 0),
        status=data.get("status", "draft"),
        company_id=company_id,
    )
    db.session.add(purchase)
    db.session.flush()

    items = data.get("items", [])
    for item_data in items:
        qty = float(item_data.get("quantity", 0))
        price = float(item_data.get("unit_price", 0))
        item = PurchaseItem(
            purchase_id=purchase.id,
            material_name=item_data.get("material_name", ""),
            quantity=qty, unit_price=price, total=qty * price,
        )
        db.session.add(item)

    total = sum(float(it.get("quantity", 0)) * float(it.get("unit_price", 0)) for it in items)
    purchase.total_amount = total

    db.session.commit()
    return success_response(data=purchase.to_dict(), message="Purchase created", status=201)


@procurement_bp.route("/api/purchases/<int:purchase_id>", methods=["GET"])
def get_purchase(purchase_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    purchase = Purchase.query.filter_by(id=purchase_id, company_id=company_id).first()
    if not purchase:
        return error_response("Purchase not found", 404)

    items = PurchaseItem.query.filter_by(purchase_id=purchase_id).all()
    data = purchase.to_dict()
    data["items"] = [i.to_dict() for i in items]
    return success_response(data=data)


@procurement_bp.route("/api/purchases/<int:purchase_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_purchase(purchase_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    purchase = Purchase.query.filter_by(id=purchase_id, company_id=company_id).first()
    if not purchase:
        return error_response("Purchase not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("supplier_id", "project_id", "total_amount", "status"):
        if field in data:
            setattr(purchase, field, data[field])

    db.session.commit()
    return success_response(data=purchase.to_dict(), message="Purchase updated")


@procurement_bp.route("/api/indents", methods=["GET"])
def list_indents():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")

    query = PurchaseIndent.query.filter_by(company_id=company_id)
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(PurchaseIndent.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@procurement_bp.route("/api/indents", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_indent():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    indent = PurchaseIndent(
        project_id=data.get("project_id"),
        status=data.get("status", "pending"),
        company_id=company_id,
    )
    db.session.add(indent)
    db.session.commit()
    return success_response(data=indent.to_dict(), message="Indent created", status=201)


@procurement_bp.route("/api/indents/<int:indent_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_indent(indent_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    indent = PurchaseIndent.query.filter_by(id=indent_id, company_id=company_id).first()
    if not indent:
        return error_response("Indent not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("project_id", "status"):
        if field in data:
            setattr(indent, field, data[field])

    db.session.commit()
    return success_response(data=indent.to_dict(), message="Indent updated")


@procurement_bp.route("/api/grns", methods=["GET"])
def list_grns():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")

    query = GRN.query.filter_by(company_id=company_id)
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(GRN.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@procurement_bp.route("/api/grns", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_grn():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    received_date_str = data.get("received_date")
    if not received_date_str:
        return error_response("received_date is required", 400)

    try:
        received_date = datetime.strptime(received_date_str, "%Y-%m-%d").date()
    except ValueError:
        return error_response("Invalid date format", 400)

    grn = GRN(
        purchase_id=data.get("purchase_id"),
        received_date=received_date,
        status=data.get("status", "pending"),
        company_id=company_id,
    )
    db.session.add(grn)
    db.session.commit()
    return success_response(data=grn.to_dict(), message="GRN created", status=201)


@procurement_bp.route("/api/grns/<int:grn_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_grn(grn_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    grn = GRN.query.filter_by(id=grn_id, company_id=company_id).first()
    if not grn:
        return error_response("GRN not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("purchase_id", "status"):
        if field in data:
            setattr(grn, field, data[field])

    if "received_date" in data:
        try:
            grn.received_date = datetime.strptime(data["received_date"], "%Y-%m-%d").date()
        except ValueError:
            return error_response("Invalid date format", 400)

    db.session.commit()
    return success_response(data=grn.to_dict(), message="GRN updated")


def create_app():
    app = create_service_app("procurement-service", import_models)
    app.register_blueprint(procurement_bp)
    return app
