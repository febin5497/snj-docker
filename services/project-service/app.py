from datetime import datetime
from flask import Blueprint, request
from shared import (
    create_service_app, db, success_response, error_response,
    get_current_user, get_current_user_claims, require_role,
    paginate_query, TimestampMixin, CompanyMixin,
)

project_bp = Blueprint("projects", __name__)


class Client(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "clients"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    address = db.Column(db.Text)

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "phone": self.phone,
            "email": self.email, "address": self.address,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Project(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "projects"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(300))
    start_date = db.Column(db.Date)
    user_id = db.Column(db.Integer, nullable=True)
    client_id = db.Column(db.Integer, db.ForeignKey("clients.id"), nullable=True)
    rate_per_sqft = db.Column(db.Float, default=0)
    square_feet = db.Column(db.Float, default=0)
    status = db.Column(db.String(30), default="planning")

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "location": self.location,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "user_id": self.user_id, "client_id": self.client_id,
            "rate_per_sqft": self.rate_per_sqft, "square_feet": self.square_feet,
            "status": self.status, "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ProjectTask(db.Model, TimestampMixin):
    __tablename__ = "project_tasks"
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(30), default="pending")
    assigned_to = db.Column(db.Integer, nullable=True)
    due_date = db.Column(db.Date)

    def to_dict(self):
        return {
            "id": self.id, "project_id": self.project_id, "title": self.title,
            "description": self.description, "status": self.status,
            "assigned_to": self.assigned_to,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ProjectStage(db.Model, TimestampMixin):
    __tablename__ = "project_stages"
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(30), default="pending")
    amount = db.Column(db.Float, default=0)
    percentage = db.Column(db.Float, default=0)

    def to_dict(self):
        return {
            "id": self.id, "project_id": self.project_id, "name": self.name,
            "status": self.status, "amount": self.amount,
            "percentage": self.percentage,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


def import_models():
    return Client, Project, ProjectTask, ProjectStage


@project_bp.route("/api/projects", methods=["GET"])
def list_projects():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")
    search = request.args.get("search", "").strip()

    query = Project.query.filter_by(company_id=company_id)
    if status:
        query = query.filter_by(status=status)
    if search:
        query = query.filter(Project.name.ilike(f"%{search}%"))
    query = query.order_by(Project.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@project_bp.route("/api/projects", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_project():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    name = data.get("name", "").strip()
    if not name:
        return error_response("Project name is required", 400)

    start_date = None
    if data.get("start_date"):
        try:
            start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
        except ValueError:
            return error_response("Invalid date format", 400)

    project = Project(
        name=name,
        location=data.get("location", ""),
        start_date=start_date,
        user_id=data.get("user_id"),
        client_id=data.get("client_id"),
        rate_per_sqft=data.get("rate_per_sqft", 0),
        square_feet=data.get("square_feet", 0),
        status=data.get("status", "planning"),
        company_id=company_id,
    )
    db.session.add(project)
    db.session.commit()
    return success_response(data=project.to_dict(), message="Project created", status=201)


@project_bp.route("/api/projects/<int:project_id>", methods=["GET"])
def get_project(project_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    project = Project.query.filter_by(id=project_id, company_id=company_id).first()
    if not project:
        return error_response("Project not found", 404)

    return success_response(data=project.to_dict())


@project_bp.route("/api/projects/<int:project_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_project(project_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    project = Project.query.filter_by(id=project_id, company_id=company_id).first()
    if not project:
        return error_response("Project not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("name", "location", "user_id", "client_id", "rate_per_sqft", "square_feet", "status"):
        if field in data:
            setattr(project, field, data[field])

    if "start_date" in data and data["start_date"]:
        try:
            project.start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
        except ValueError:
            return error_response("Invalid date format", 400)

    db.session.commit()
    return success_response(data=project.to_dict(), message="Project updated")


@project_bp.route("/api/projects/<int:project_id>", methods=["DELETE"])
@require_role("super_admin", "admin")
def delete_project(project_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    project = Project.query.filter_by(id=project_id, company_id=company_id).first()
    if not project:
        return error_response("Project not found", 404)

    project.status = "cancelled"
    db.session.commit()
    return success_response(message="Project cancelled")


@project_bp.route("/api/clients", methods=["GET"])
def list_clients():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    search = request.args.get("search", "").strip()

    query = Client.query.filter_by(company_id=company_id)
    if search:
        query = query.filter(Client.name.ilike(f"%{search}%"))
    query = query.order_by(Client.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@project_bp.route("/api/clients", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_client():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    name = data.get("name", "").strip()
    if not name:
        return error_response("Client name is required", 400)

    client = Client(
        name=name,
        phone=data.get("phone", ""),
        email=data.get("email", ""),
        address=data.get("address", ""),
        company_id=company_id,
    )
    db.session.add(client)
    db.session.commit()
    return success_response(data=client.to_dict(), message="Client created", status=201)


@project_bp.route("/api/clients/<int:client_id>", methods=["GET"])
def get_client(client_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    client = Client.query.filter_by(id=client_id, company_id=company_id).first()
    if not client:
        return error_response("Client not found", 404)

    return success_response(data=client.to_dict())


@project_bp.route("/api/clients/<int:client_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_client(client_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    client = Client.query.filter_by(id=client_id, company_id=company_id).first()
    if not client:
        return error_response("Client not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("name", "phone", "email", "address"):
        if field in data:
            setattr(client, field, data[field])

    db.session.commit()
    return success_response(data=client.to_dict(), message="Client updated")


@project_bp.route("/api/projects/<int:project_id>/tasks", methods=["GET"])
def list_tasks(project_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    project = Project.query.filter_by(id=project_id, company_id=company_id).first()
    if not project:
        return error_response("Project not found", 404)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")

    query = ProjectTask.query.filter_by(project_id=project_id)
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(ProjectTask.id.desc())

    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@project_bp.route("/api/projects/<int:project_id>/tasks", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_task(project_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    project = Project.query.filter_by(id=project_id, company_id=company_id).first()
    if not project:
        return error_response("Project not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    title = data.get("title", "").strip()
    if not title:
        return error_response("Task title is required", 400)

    due_date = None
    if data.get("due_date"):
        try:
            due_date = datetime.strptime(data["due_date"], "%Y-%m-%d").date()
        except ValueError:
            return error_response("Invalid date format", 400)

    task = ProjectTask(
        project_id=project_id,
        title=title,
        description=data.get("description", ""),
        status=data.get("status", "pending"),
        assigned_to=data.get("assigned_to"),
        due_date=due_date,
    )
    db.session.add(task)
    db.session.commit()
    return success_response(data=task.to_dict(), message="Task created", status=201)


@project_bp.route("/api/projects/<int:project_id>/tasks/<int:task_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_task(project_id, task_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    project = Project.query.filter_by(id=project_id, company_id=company_id).first()
    if not project:
        return error_response("Project not found", 404)

    task = ProjectTask.query.filter_by(id=task_id, project_id=project_id).first()
    if not task:
        return error_response("Task not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("title", "description", "status", "assigned_to"):
        if field in data:
            setattr(task, field, data[field])

    if "due_date" in data and data["due_date"]:
        try:
            task.due_date = datetime.strptime(data["due_date"], "%Y-%m-%d").date()
        except ValueError:
            return error_response("Invalid date format", 400)

    db.session.commit()
    return success_response(data=task.to_dict(), message="Task updated")


@project_bp.route("/api/projects/<int:project_id>/stages", methods=["GET"])
def list_stages(project_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    project = Project.query.filter_by(id=project_id, company_id=company_id).first()
    if not project:
        return error_response("Project not found", 404)

    stages = ProjectStage.query.filter_by(project_id=project_id).order_by(ProjectStage.id).all()
    return success_response(data=[s.to_dict() for s in stages])


@project_bp.route("/api/projects/<int:project_id>/stages", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_stage(project_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    project = Project.query.filter_by(id=project_id, company_id=company_id).first()
    if not project:
        return error_response("Project not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    name = data.get("name", "").strip()
    if not name:
        return error_response("Stage name is required", 400)

    stage = ProjectStage(
        project_id=project_id,
        name=name,
        status=data.get("status", "pending"),
        amount=data.get("amount", 0),
        percentage=data.get("percentage", 0),
    )
    db.session.add(stage)
    db.session.commit()
    return success_response(data=stage.to_dict(), message="Stage created", status=201)


@project_bp.route("/api/projects/<int:project_id>/stages/<int:stage_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_stage(project_id, stage_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    project = Project.query.filter_by(id=project_id, company_id=company_id).first()
    if not project:
        return error_response("Project not found", 404)

    stage = ProjectStage.query.filter_by(id=stage_id, project_id=project_id).first()
    if not stage:
        return error_response("Stage not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("name", "status", "amount", "percentage"):
        if field in data:
            setattr(stage, field, data[field])

    db.session.commit()
    return success_response(data=stage.to_dict(), message="Stage updated")


def create_app():
    app = create_service_app("project-service", import_models)
    app.register_blueprint(project_bp)
    return app
