from flask import jsonify


def success_response(data=None, message="Success", status=200, pagination=None):
    response = {"success": True, "message": message}
    if data is not None:
        response["data"] = data
    if pagination:
        response["pagination"] = pagination
    return jsonify(response), status


def error_response(message="Error", status=400, errors=None):
    response = {"success": False, "message": message}
    if errors:
        response["errors"] = errors
    return jsonify(response), status


def paginate_query(query, page, per_page):
    page = page or 1
    per_page = per_page or 20
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "items": [item.to_dict() if hasattr(item, 'to_dict') else str(item) for item in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page,
        "per_page": per_page,
    }
