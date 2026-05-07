from flask import Blueprint, request, jsonify
from app.services.recurring_service import (
    create_recurring_transaction,
    get_recurring_transactions,
    delete_recurring_transaction,
    update_recurring_transaction,
    generate_recurring_transactions
)
from app.services.validations import validate_recurring_transaction

recurring_bp = Blueprint("recurring", __name__)


@recurring_bp.route("/recurring", methods=["GET"])
def list_recurring():
    try:
        recurring = get_recurring_transactions()
        return jsonify(recurring), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@recurring_bp.route("/recurring", methods=["POST"])
def add_recurring():
    data = request.get_json(silent=True) or {}

    errors = validate_recurring_transaction(data)

    if errors:
        return jsonify({"errors": errors}), 400

    try:
        create_recurring_transaction(data)
        generate_recurring_transactions()
        return jsonify({"ok": True}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@recurring_bp.route("/recurring/<int:recurring_id>", methods=["DELETE"])
def delete_single_recurring(recurring_id):
    try:
        delete_recurring_transaction(recurring_id)
        return jsonify({"ok": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@recurring_bp.route("/recurring/<int:recurring_id>", methods=["PUT"])
def update_single_recurring(recurring_id):
    data = request.get_json(silent=True) or {}

    errors = validate_recurring_transaction(data)

    if errors:
        return jsonify({"errors": errors}), 400

    try:
        update_recurring_transaction(recurring_id, data)
        generate_recurring_transactions()
        return jsonify({"ok": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
