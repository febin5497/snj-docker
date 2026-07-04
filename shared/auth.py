import os
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, create_access_token, create_refresh_token
import jwt
import datetime


JWT_SECRET = os.getenv("JWT_SECRET", "construction-erp-secret-key-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24


def generate_tokens(user_id, username, role, company_id):
    extra_claims = {
        "username": username,
        "role": role,
        "company_id": company_id,
    }
    access = create_access_token(
        identity=str(user_id),
        additional_claims=extra_claims,
        expires_delta=datetime.timedelta(hours=JWT_EXPIRY_HOURS),
    )
    refresh = create_refresh_token(
        identity=str(user_id),
        additional_claims=extra_claims,
        expires_delta=datetime.timedelta(days=30),
    )
    return {"access_token": access, "refresh_token": refresh}


def get_current_user():
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        return int(user_id)
    except Exception:
        return None


def get_current_user_claims():
    try:
        verify_jwt_in_request()
        from flask_jwt_extended import get_jwt
        return get_jwt()
    except Exception:
        return {}


def require_role(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
                claims = get_jwt()
                user_role = claims.get("role", "")
                if user_role not in roles:
                    return jsonify({"error": "Insufficient permissions"}), 403
                return fn(*args, **kwargs)
            except Exception:
                return jsonify({"error": "Authentication required"}), 401
        return wrapper
    return decorator


def admin_required(fn):
    return require_role("super_admin", "admin")(fn)


def manager_or_admin(fn):
    return require_role("super_admin", "admin", "manager")(fn)
