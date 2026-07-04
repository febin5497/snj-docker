from datetime import datetime
from flask import Blueprint, request
from shared import (
    create_service_app, db, success_response, error_response,
    get_current_user, get_current_user_claims, require_role,
    paginate_query, TimestampMixin, CompanyMixin,
)

sales_bp = Blueprint("sales", __name__)


class Sale(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "sales"
    id = db.Column(db.Integer, primary_key=True)
    client_name = db.Column(db.String(200))
    project_id = db.Column(db.Integer, nullable=True)
    total_amount = db.Column(db.Float, default=0)
    status = db.Column(db.String(20), default="draft")

    def to_dict(self):
        return {
            "id": self.id, "client_name": self.client_name,
            "project_id": self.project_id,
            "total_amount": self.total_amount, "status": self.status,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class SaleItem(db.Model, TimestampMixin):
    __tablename__ = "sale_items"
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey("sales.id"), nullable=False)
    material_name = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            "id": self.id, "sale_id": self.sale_id,
            "material_name": self.material_name,
            "quantity": self.quantity, "unit_price": self.unit_price,
            "total": self.total,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Quote(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "quotes"
    id = db.Column(db.Integer, primary_key=True)
    client_name = db.Column(db.String(200))
    project_id = db.Column(db.Integer, nullable=True)
    total_amount = db.Column(db.Float, default=0)
    status = db.Column(db.String(20), default="draft")

    def to_dict(self):
        return {
            "id": self.id, "client_name": self.client_name,
            "project_id": self.project_id,
            "total_amount": self.total_amount, "status": self.status,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class QuoteItem(db.Model, TimestampMixin):
    __tablename__ = "quote_items"
    id = db.Column(db.Integer, primary_key=True)
    quote_id = db.Column(db.Integer, db.ForeignKey("quotes.id"), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            "id": self.id, "quote_id": self.quote_id,
            "description": self.description,
            "quantity": self.quantity, "unit_price": self.unit_price,
            "total": self.total,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


def import_models():
    return Sale, SaleItem, Quote, QuoteItem


@sales_bp.route("/api/sales", methods=["GET"])
def list_sales():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")
    project_id = request.args.get("project_id", type=int)

    query = Sale.query.filter_by(company_id=company_id)
    if status:
        query = query.filter_by(status=status)
    if project_id:
        query = query.filter_by(project_id=project_id)
    query = query.order_by(Sale.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@sales_bp.route("/api/sales", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_sale():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    sale = Sale(
        client_name=data.get("client_name", ""),
        project_id=data.get("project_id"),
        total_amount=data.get("total_amount", 0),
        status=data.get("status", "draft"),
        company_id=company_id,
    )
    db.session.add(sale)
    db.session.flush()

    items = data.get("items", [])
    for item_data in items:
        qty = float(item_data.get("quantity", 0))
        price = float(item_data.get("unit_price", 0))
        item = SaleItem(
            sale_id=sale.id,
            material_name=item_data.get("material_name", ""),
            quantity=qty, unit_price=price, total=qty * price,
        )
        db.session.add(item)

    total = sum(float(it.get("quantity", 0)) * float(it.get("unit_price", 0)) for it in items)
    sale.total_amount = total

    db.session.commit()
    return success_response(data=sale.to_dict(), message="Sale created", status=201)


@sales_bp.route("/api/sales/<int:sale_id>", methods=["GET"])
def get_sale(sale_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    sale = Sale.query.filter_by(id=sale_id, company_id=company_id).first()
    if not sale:
        return error_response("Sale not found", 404)

    items = SaleItem.query.filter_by(sale_id=sale_id).all()
    data = sale.to_dict()
    data["items"] = [i.to_dict() for i in items]
    return success_response(data=data)


@sales_bp.route("/api/sales/<int:sale_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_sale(sale_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    sale = Sale.query.filter_by(id=sale_id, company_id=company_id).first()
    if not sale:
        return error_response("Sale not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("client_name", "project_id", "total_amount", "status"):
        if field in data:
            setattr(sale, field, data[field])

    db.session.commit()
    return success_response(data=sale.to_dict(), message="Sale updated")


@sales_bp.route("/api/sales/<int:sale_id>", methods=["DELETE"])
@require_role("super_admin", "admin")
def delete_sale(sale_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    sale = Sale.query.filter_by(id=sale_id, company_id=company_id).first()
    if not sale:
        return error_response("Sale not found", 404)
    db.session.delete(sale)
    db.session.commit()
    return success_response(message="Sale deleted")


@sales_bp.route("/api/quotes", methods=["GET"])
def list_quotes():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")
    project_id = request.args.get("project_id", type=int)

    query = Quote.query.filter_by(company_id=company_id)
    if status:
        query = query.filter_by(status=status)
    if project_id:
        query = query.filter_by(project_id=project_id)
    query = query.order_by(Quote.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@sales_bp.route("/api/quotes", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_quote():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    quote = Quote(
        client_name=data.get("client_name", ""),
        project_id=data.get("project_id"),
        total_amount=data.get("total_amount", 0),
        status=data.get("status", "draft"),
        company_id=company_id,
    )
    db.session.add(quote)
    db.session.flush()

    items = data.get("items", [])
    for item_data in items:
        qty = float(item_data.get("quantity", 0))
        price = float(item_data.get("unit_price", 0))
        item = QuoteItem(
            quote_id=quote.id,
            description=item_data.get("description", ""),
            quantity=qty, unit_price=price, total=qty * price,
        )
        db.session.add(item)

    total = sum(float(it.get("quantity", 0)) * float(it.get("unit_price", 0)) for it in items)
    quote.total_amount = total

    db.session.commit()
    return success_response(data=quote.to_dict(), message="Quote created", status=201)


@sales_bp.route("/api/quotes/<int:quote_id>", methods=["GET"])
def get_quote(quote_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    quote = Quote.query.filter_by(id=quote_id, company_id=company_id).first()
    if not quote:
        return error_response("Quote not found", 404)

    items = QuoteItem.query.filter_by(quote_id=quote_id).all()
    data = quote.to_dict()
    data["items"] = [i.to_dict() for i in items]
    return success_response(data=data)


@sales_bp.route("/api/quotes/<int:quote_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_quote(quote_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    quote = Quote.query.filter_by(id=quote_id, company_id=company_id).first()
    if not quote:
        return error_response("Quote not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("client_name", "project_id", "total_amount", "status"):
        if field in data:
            setattr(quote, field, data[field])

    db.session.commit()
    return success_response(data=quote.to_dict(), message="Quote updated")


@sales_bp.route("/api/quotes/<int:quote_id>", methods=["DELETE"])
@require_role("super_admin", "admin")
def delete_quote(quote_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    quote = Quote.query.filter_by(id=quote_id, company_id=company_id).first()
    if not quote:
        return error_response("Quote not found", 404)
    db.session.delete(quote)
    db.session.commit()
    return success_response(message="Quote deleted")


@sales_bp.route("/api/estimates", methods=["GET"])
def list_estimates():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")

    query = Quote.query.filter_by(company_id=company_id)
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(Quote.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@sales_bp.route("/api/estimates", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_estimate():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    quote = Quote(
        client_name=data.get("client_name", ""),
        project_id=data.get("project_id"),
        total_amount=data.get("total_amount", 0),
        status="estimate",
        company_id=company_id,
    )
    db.session.add(quote)
    db.session.flush()

    items = data.get("items", [])
    for item_data in items:
        qty = float(item_data.get("quantity", 0))
        price = float(item_data.get("unit_price", 0))
        item = QuoteItem(
            quote_id=quote.id,
            description=item_data.get("description", ""),
            quantity=qty, unit_price=price, total=qty * price,
        )
        db.session.add(item)

    total = sum(float(it.get("quantity", 0)) * float(it.get("unit_price", 0)) for it in items)
    quote.total_amount = total

    db.session.commit()
    return success_response(data=quote.to_dict(), message="Estimate created", status=201)


def create_app():
    app = create_service_app("sales-service", import_models)
    app.register_blueprint(sales_bp)
    return app
