from datetime import datetime
from flask import Blueprint, request
from shared import (
    create_service_app, db, success_response, error_response,
    get_current_user, get_current_user_claims, require_role,
    paginate_query, TimestampMixin, CompanyMixin,
)

finance_bp = Blueprint("finance", __name__)


class CashTransaction(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "cash_transactions"
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, nullable=True)
    staff_id = db.Column(db.Integer, nullable=True)
    date = db.Column(db.Date, nullable=False)
    type = db.Column(db.String(20), nullable=False)
    category = db.Column(db.String(100))
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text)
    created_by = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "project_id": self.project_id,
            "staff_id": self.staff_id, "date": self.date.isoformat() if self.date else None,
            "type": self.type, "category": self.category,
            "amount": self.amount, "description": self.description,
            "created_by": self.created_by, "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Invoice(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "invoices"
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, nullable=True)
    invoice_number = db.Column(db.String(50), nullable=False)
    client_name = db.Column(db.String(200))
    amount = db.Column(db.Float, nullable=False)
    tax = db.Column(db.Float, default=0)
    total = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default="draft")
    due_date = db.Column(db.Date)

    def to_dict(self):
        return {
            "id": self.id, "project_id": self.project_id,
            "invoice_number": self.invoice_number,
            "client_name": self.client_name,
            "amount": self.amount, "tax": self.tax, "total": self.total,
            "status": self.status,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Budget(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "budgets"
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, nullable=True)
    category = db.Column(db.String(100), nullable=False)
    budget_amount = db.Column(db.Float, nullable=False)
    spent_amount = db.Column(db.Float, default=0)

    def to_dict(self):
        return {
            "id": self.id, "project_id": self.project_id,
            "category": self.category,
            "budget_amount": self.budget_amount,
            "spent_amount": self.spent_amount,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ChartOfAccounts(db.Model, TimestampMixin, CompanyMixin):
    __tablename__ = "chart_of_accounts"
    id = db.Column(db.Integer, primary_key=True)
    account_code = db.Column(db.String(20), nullable=False)
    account_name = db.Column(db.String(200), nullable=False)
    account_type = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            "id": self.id, "account_code": self.account_code,
            "account_name": self.account_name,
            "account_type": self.account_type,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


def import_models():
    return CashTransaction, Invoice, Budget, ChartOfAccounts


@finance_bp.route("/api/finance/transactions", methods=["GET"])
def list_transactions():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    tx_type = request.args.get("type")
    project_id = request.args.get("project_id", type=int)
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    query = CashTransaction.query.filter_by(company_id=company_id)
    if tx_type:
        query = query.filter_by(type=tx_type)
    if project_id:
        query = query.filter_by(project_id=project_id)
    if start_date:
        try:
            query = query.filter(CashTransaction.date >= datetime.strptime(start_date, "%Y-%m-%d").date())
        except ValueError:
            pass
    if end_date:
        try:
            query = query.filter(CashTransaction.date <= datetime.strptime(end_date, "%Y-%m-%d").date())
        except ValueError:
            pass

    query = query.order_by(CashTransaction.id.desc())
    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@finance_bp.route("/api/finance/transactions", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_transaction():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    tx_type = data.get("type")
    amount = data.get("amount")
    date_str = data.get("date")
    if not tx_type or amount is None or not date_str:
        return error_response("type, amount, and date are required", 400)

    try:
        tx_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return error_response("Invalid date format", 400)

    transaction = CashTransaction(
        project_id=data.get("project_id"),
        staff_id=data.get("staff_id"),
        date=tx_date,
        type=tx_type,
        category=data.get("category", ""),
        amount=float(amount),
        description=data.get("description", ""),
        created_by=get_current_user(),
        company_id=company_id,
    )
    db.session.add(transaction)
    db.session.commit()
    return success_response(data=transaction.to_dict(), message="Transaction created", status=201)


@finance_bp.route("/api/finance/transactions/<int:tx_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_transaction(tx_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    transaction = CashTransaction.query.filter_by(id=tx_id, company_id=company_id).first()
    if not transaction:
        return error_response("Transaction not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("type", "category", "amount", "description", "project_id", "staff_id"):
        if field in data:
            setattr(transaction, field, data[field])

    if "date" in data:
        try:
            transaction.date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except ValueError:
            return error_response("Invalid date format", 400)

    db.session.commit()
    return success_response(data=transaction.to_dict(), message="Transaction updated")


@finance_bp.route("/api/finance/transactions/<int:tx_id>", methods=["DELETE"])
@require_role("super_admin", "admin")
def delete_transaction(tx_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    transaction = CashTransaction.query.filter_by(id=tx_id, company_id=company_id).first()
    if not transaction:
        return error_response("Transaction not found", 404)

    db.session.delete(transaction)
    db.session.commit()
    return success_response(message="Transaction deleted")


@finance_bp.route("/api/invoices", methods=["GET"])
def list_invoices():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")
    project_id = request.args.get("project_id", type=int)

    query = Invoice.query.filter_by(company_id=company_id)
    if status:
        query = query.filter_by(status=status)
    if project_id:
        query = query.filter_by(project_id=project_id)

    query = query.order_by(Invoice.id.desc())
    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@finance_bp.route("/api/invoices", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_invoice():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    invoice_number = data.get("invoice_number", "").strip()
    amount = data.get("amount")
    if not invoice_number or amount is None:
        return error_response("Invoice number and amount are required", 400)

    tax = data.get("tax", 0)
    total = float(amount) + float(tax)

    invoice = Invoice(
        project_id=data.get("project_id"),
        invoice_number=invoice_number,
        client_name=data.get("client_name", ""),
        amount=float(amount),
        tax=float(tax),
        total=total,
        status=data.get("status", "draft"),
        due_date=None,
        company_id=company_id,
    )
    if data.get("due_date"):
        try:
            invoice.due_date = datetime.strptime(data["due_date"], "%Y-%m-%d").date()
        except ValueError:
            pass

    db.session.add(invoice)
    db.session.commit()
    return success_response(data=invoice.to_dict(), message="Invoice created", status=201)


@finance_bp.route("/api/invoices/<int:invoice_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_invoice(invoice_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    invoice = Invoice.query.filter_by(id=invoice_id, company_id=company_id).first()
    if not invoice:
        return error_response("Invoice not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("invoice_number", "client_name", "amount", "tax", "status", "project_id"):
        if field in data:
            setattr(invoice, field, data[field])

    if "amount" in data or "tax" in data:
        invoice.total = invoice.amount + invoice.tax

    if "due_date" in data and data["due_date"]:
        try:
            invoice.due_date = datetime.strptime(data["due_date"], "%Y-%m-%d").date()
        except ValueError:
            pass

    db.session.commit()
    return success_response(data=invoice.to_dict(), message="Invoice updated")


@finance_bp.route("/api/budgets", methods=["GET"])
def list_budgets():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    project_id = request.args.get("project_id", type=int)
    query = Budget.query.filter_by(company_id=company_id)
    if project_id:
        query = query.filter_by(project_id=project_id)

    budgets = query.order_by(Budget.id.desc()).all()
    return success_response(data=[b.to_dict() for b in budgets])


@finance_bp.route("/api/budgets", methods=["POST"])
@require_role("super_admin", "admin", "manager")
def create_budget():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    category = data.get("category", "").strip()
    budget_amount = data.get("budget_amount")
    if not category or budget_amount is None:
        return error_response("Category and budget_amount are required", 400)

    budget = Budget(
        project_id=data.get("project_id"),
        category=category,
        budget_amount=float(budget_amount),
        spent_amount=0,
        company_id=company_id,
    )
    db.session.add(budget)
    db.session.commit()
    return success_response(data=budget.to_dict(), message="Budget created", status=201)


@finance_bp.route("/api/budgets/<int:budget_id>", methods=["PUT"])
@require_role("super_admin", "admin", "manager")
def update_budget(budget_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    budget = Budget.query.filter_by(id=budget_id, company_id=company_id).first()
    if not budget:
        return error_response("Budget not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("category", "budget_amount", "spent_amount", "project_id"):
        if field in data:
            setattr(budget, field, data[field])

    db.session.commit()
    return success_response(data=budget.to_dict(), message="Budget updated")


@finance_bp.route("/api/chart-of-accounts", methods=["GET"])
def list_accounts():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)
    account_type = request.args.get("account_type")

    query = ChartOfAccounts.query.filter_by(company_id=company_id)
    if account_type:
        query = query.filter_by(account_type=account_type)

    query = query.order_by(ChartOfAccounts.account_code)
    pagination = paginate_query(query, page, per_page)
    return success_response(data=pagination)


@finance_bp.route("/api/chart-of-accounts", methods=["POST"])
@require_role("super_admin", "admin")
def create_account():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    account_code = data.get("account_code", "").strip()
    account_name = data.get("account_name", "").strip()
    account_type = data.get("account_type", "").strip()
    if not account_code or not account_name or not account_type:
        return error_response("account_code, account_name, and account_type are required", 400)

    account = ChartOfAccounts(
        account_code=account_code,
        account_name=account_name,
        account_type=account_type,
        company_id=company_id,
    )
    db.session.add(account)
    db.session.commit()
    return success_response(data=account.to_dict(), message="Account created", status=201)


@finance_bp.route("/api/chart-of-accounts/<int:account_id>", methods=["PUT"])
@require_role("super_admin", "admin")
def update_account(account_id):
    claims = get_current_user_claims()
    company_id = claims.get("company_id")

    account = ChartOfAccounts.query.filter_by(id=account_id, company_id=company_id).first()
    if not account:
        return error_response("Account not found", 404)

    data = request.get_json(silent=True)
    if not data:
        return error_response("Request body required", 400)

    for field in ("account_code", "account_name", "account_type"):
        if field in data:
            setattr(account, field, data[field])

    db.session.commit()
    return success_response(data=account.to_dict(), message="Account updated")


@finance_bp.route("/api/finance/report", methods=["GET"])
def finance_report():
    claims = get_current_user_claims()
    company_id = claims.get("company_id")
    if not company_id:
        return error_response("Company context required", 400)

    project_id = request.args.get("project_id", type=int)

    income = db.session.query(db.func.sum(CashTransaction.amount)).filter(
        CashTransaction.company_id == company_id,
        CashTransaction.type == "income",
    )
    expense = db.session.query(db.func.sum(CashTransaction.amount)).filter(
        CashTransaction.company_id == company_id,
        CashTransaction.type == "expense",
    )
    if project_id:
        income = income.filter(CashTransaction.project_id == project_id)
        expense = expense.filter(CashTransaction.project_id == project_id)

    total_income = income.scalar() or 0
    total_expense = expense.scalar() or 0

    pending_invoices = Invoice.query.filter_by(
        company_id=company_id, status="pending"
    ).count()

    return success_response(data={
        "total_income": total_income,
        "total_expense": total_expense,
        "net_balance": total_income - total_expense,
        "pending_invoices": pending_invoices,
    })


def create_app():
    app = create_service_app("finance-service", import_models)
    app.register_blueprint(finance_bp)
    return app
