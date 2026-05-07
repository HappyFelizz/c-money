from flask import Blueprint, request, jsonify
from app.services.transaction_service import (
    create_transaction,
    delete_transaction,
    update_transaction,
    ensure_transaction_reference_columns,
    refresh_all_transaction_references,
)
from app.services.salary_service import (
    save_financial_settings,
    get_financial_settings,
    get_salary_for_month,
    get_projected_months_with_salary,
    update_month_salary,
)
from app.database.db import get_connection
from app.services.validations import validate_transaction

transaction_bp = Blueprint("transactions", __name__)

@transaction_bp.route("/transactions", methods=["POST"])
def add_transaction():
    data = request.get_json(silent=True) or {}

    errors = validate_transaction(data)

    if errors:
        return jsonify({"errors": errors}), 400
    
    create_transaction(data)
    return jsonify({"ok": True}), 201



@transaction_bp.route("/transactions/<int:year>/<int:month>")
def get_transactions(year, month):
    ensure_transaction_reference_columns()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM transactions
        WHERE reference_year = ?
        AND reference_month = ?
        ORDER BY date ASC, id ASC
    """, (year, month))

    data = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify(data)

@transaction_bp.route("/summary/<int:year>/<int:month>")
def summary(year, month):
    ensure_transaction_reference_columns()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT type, SUM(value) as total, COUNT(*) as count
        FROM transactions
        WHERE reference_year = ?
        AND reference_month = ?
        GROUP BY type
    """, (year, month))

    result = {}
    for row in cursor.fetchall():
        result[row["type"]] = {
            "total": row["total"],
            "count": row["count"]
        }

    cursor.execute("""
        SELECT COALESCE(SUM(value), 0) AS total_month, COUNT(*) as total_count
        FROM transactions
        WHERE reference_year = ?
        AND reference_month = ?
    """, (year, month))

    month_summary = cursor.fetchone()
    result["total_month"] = month_summary["total_month"]
    result["total_count"] = month_summary["total_count"]

    salary_month = get_salary_for_month(year, month)
    result["salary_month"] = salary_month
    result["balance_month"] = salary_month - float(result["total_month"] or 0)

    conn.close()

    return jsonify(result)


@transaction_bp.route("/settings/salary", methods=["GET"])
def get_salary_settings():
    try:
        settings = get_financial_settings()
        return jsonify(settings), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@transaction_bp.route("/settings/salary", methods=["POST"])
def save_salary_settings():
    data = request.get_json(silent=True) or {}
    monthly_salary = data.get("monthly_salary")
    credit_card_closing_day = data.get("credit_card_closing_day", 4)

    try:
        monthly_salary = float(monthly_salary)
    except (TypeError, ValueError):
        return jsonify({"errors": ["Informe um salário válido"]}), 400

    if monthly_salary < 0:
        return jsonify({"errors": ["O salário não pode ser negativo"]}), 400

    try:
        credit_card_closing_day = int(credit_card_closing_day)
    except (TypeError, ValueError):
        return jsonify({"errors": ["Informe um dia de fechamento válido"]}), 400

    if credit_card_closing_day < 1 or credit_card_closing_day > 31:
        return jsonify({"errors": ["Dia de fechamento deve estar entre 1 e 31"]}), 400

    try:
        save_financial_settings(monthly_salary, credit_card_closing_day)
        refresh_all_transaction_references()
        return jsonify({"ok": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@transaction_bp.route("/settings/salary/months", methods=["GET"])
def get_projected_salary_months():
    try:
        months = get_projected_months_with_salary()
        return jsonify(months), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@transaction_bp.route("/settings/salary/month/<int:year>/<int:month>", methods=["PUT"])
def update_salary_month(year, month):
    data = request.get_json(silent=True) or {}
    salary = data.get("salary")

    try:
        salary = float(salary)
    except (TypeError, ValueError):
        return jsonify({"errors": ["Informe um salário válido"]}), 400

    if salary < 0:
        return jsonify({"errors": ["O salário não pode ser negativo"]}), 400

    try:
        update_month_salary(year, month, salary)
        return jsonify({"ok": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@transaction_bp.route("/transactions/<int:transaction_id>", methods=["DELETE"])
def delete_single_transaction(transaction_id):
    try:
        delete_transaction(transaction_id)
        return jsonify({"ok": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@transaction_bp.route("/transactions/<int:transaction_id>", methods=["PUT"])
def update_single_transaction(transaction_id):
    data = request.get_json(silent=True) or {}

    errors = validate_transaction(data)

    if errors:
        return jsonify({"errors": errors}), 400

    try:
        update_transaction(transaction_id, data)
        return jsonify({"ok": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500