from flask import Blueprint, request
from shared import (
    create_service_app, db, success_response, error_response,
    get_current_user, get_current_user_claims, require_role,
    paginate_query, TimestampMixin,
)

inventory_bp = Blueprint("inventory", __name__)


class Material(db.Model, TimestampMixin):
    __tablename__ = "materials"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    quantity = db.Column(db.Float, default=0)
    unit_of_measurement = db.Column(db.String(50))
    price = db.Column(db.Float, default=0)
    project_id = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "name": self.name,
            "description": self.description,
            "quantity": self.quantity,
            "unit_of_measurement": self.unit_of_measurement,
            "price": self.price, "project_id": self.project_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Equipment(db.Model, TimestampMixin):
    __tablename__ = "equipment"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100))
    equipment_code = db.Column(db.String(50), unique=True)
    company_id = db.Column(db.Integer, db.ForeignKey("companies.id"), nullable=False)
    condition = db.Column(db.String(50), default="good")
    is_active = db.Column(db.Boolean, default=True)
    purchase_cost = db.Column(db.Float, default=0)

    def to_dict(self):
        return {
            "id": self.id, "name": self.name,
            "category": self.category,
            "equipment_code": self.equipment_code,
            "company_id": self.company_id,
            "condition": self.condition,
            "is_active": self.is_active,
            "purchase_cost": self.purchase_cost,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


def import_models():
    return Material, Equipment


@inventory_bp.route("/api/materials", methods=["GET"])
def list_materials():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    project_id = request.args.get("project_id", type=int)
    search = request.args.get("search", "").strip()

    query = Material.query
    if project_id:
        query = query.filter_by(project_id=project_id)
    if search:
        query = query.filter(Material.name.ilike(f"%{search}%"))
    query = query.order_by(Material.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@inventory_bp.route("/api/materials", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_material():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    name = data.get("name", "").strip()
    if not name:
        return error_response("Material name is required", 400)

    material = Material(
        name=name,
        description=data.get("description", ""),
        quantity=float(data.get("quantity", 0)),
        unit_of_measurement=data.get("unit_of_measurement", ""),
        price=float(data.get("price", 0)),
        project_id=data.get("project_id"),
    )
    db.session.add(material)
    db.session.commit()
    return success_response(data=material.to_dict(), message="Material created", status=201)


@inventory_bp.route("/api/materials/<int:material_id>", methods=["GET"])
def get_material(material_id):
    material = Material.query.get(material_id)
    if not material:
        return error_response("Material not found", 404)
    return success_response(data=material.to_dict())


@inventory_bp.route("/api/materials/<int:material_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_material(material_id):
    material = Material.query.get(material_id)
    if not material:
        return error_response("Material not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("name", "description", "quantity", "unit_of_measurement", "price", "project_id"):
        if field in data:
            setattr(material, field, data[field])

    db.session.commit()
    return success_response(data=material.to_dict(), message="Material updated")


@inventory_bp.route("/api/materials/<int:material_id>", methods=["DELETE"])
@require_role("super_admin", "admin")
def delete_material(material_id):
    material = Material.query.get(material_id)
    if not material:
        return error_response("Material not found", 404)

    db.session.delete(material)
    db.session.commit()
    return success_response(message="Material deleted")


@inventory_bp.route("/api/materials/stats", methods=["GET"])
def material_stats():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    total_materials = Material.query.count()
    total_value = db.session.query(
        db.func.sum(Material.quantity * Material.price)
    ).scalar() or 0
    low_stock = Material.query.filter(Material.quantity < 10).count()

    return success_response(data={
        "total_materials": total_materials,
        "total_value": round(total_value, 2),
        "low_stock_count": low_stock,
    })


@inventory_bp.route("/api/equipment", methods=["GET"])
def list_equipment():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    category = request.args.get("category")
    search = request.args.get("search", "").strip()

    query = Equipment.query.filter_by(company_id=company_id)
    if category:
        query = query.filter_by(category=category)
    if search:
        query = query.filter(Equipment.name.ilike(f"%{search}%"))
    query = query.order_by(Equipment.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@inventory_bp.route("/api/equipment", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_equipment():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    name = data.get("name", "").strip()
    equipment_code = data.get("equipment_code", "").strip()
    if not name or not equipment_code:
        return error_response("Name and equipment_code are required", 400)

    if Equipment.query.filter_by(equipment_code=equipment_code, company_id=company_id).first():
        return error_response("Equipment code already exists", 409)

    equipment = Equipment(
        name=name,
        category=data.get("category", ""),
        equipment_code=equipment_code,
        company_id=company_id,
        condition=data.get("condition", "good"),
        is_active=True,
        purchase_cost=float(data.get("purchase_cost", 0)),
    )
    db.session.add(equipment)
    db.session.commit()
    return success_response(data=equipment.to_dict(), message="Equipment created", status=201)


@inventory_bp.route("/api/equipment/<int:equipment_id>", methods=["GET"])
def get_equipment(equipment_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    equipment = Equipment.query.filter_by(id=equipment_id, company_id=company_id).first()
    if not equipment:
        return error_response("Equipment not found", 404)
    return success_response(data=equipment.to_dict())


@inventory_bp.route("/api/equipment/<int:equipment_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_equipment(equipment_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    equipment = Equipment.query.filter_by(id=equipment_id, company_id=company_id).first()
    if not equipment:
        return error_response("Equipment not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("name", "category", "condition", "is_active", "purchase_cost"):
        if field in data:
            setattr(equipment, field, data[field])

    db.session.commit()
    return success_response(data=equipment.to_dict(), message="Equipment updated")


@inventory_bp.route("/api/equipment/<int:equipment_id>", methods=["DELETE"])
@require_role("super_admin", "admin")
def delete_equipment(equipment_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    equipment = Equipment.query.filter_by(id=equipment_id, company_id=company_id).first()
    if not equipment:
        return error_response("Equipment not found", 404)

    equipment.is_active = False
    db.session.commit()
    return success_response(message="Equipment deactivated")


@inventory_bp.route("/api/equipment/stats", methods=["GET"])
def equipment_stats():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    total = Equipment.query.filter_by(company_id=company_id).count()
    active = Equipment.query.filter_by(company_id=company_id, is_active=True).count()
    total_cost = db.session.query(
        db.func.sum(Equipment.purchase_cost)
    ).filter_by(company_id=company_id).scalar() or 0

    return success_response(data={
        "total_equipment": total,
        "active_equipment": active,
        "total_value": round(total_cost, 2),
    })


def create_app():
    app = create_service_app("inventory-service", import_models)
    app.register_blueprint(inventory_bp)
    return app
