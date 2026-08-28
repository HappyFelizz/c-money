from app.database.db import get_connection, get_table_columns, is_postgres
from datetime import datetime
from app.services.salary_service import get_credit_card_closing_day
from app.services.payment_method_service import ensure_payment_methods_table, get_payment_method, is_credit_card_method


def ensure_transaction_reference_columns():
    ensure_payment_methods_table()
    closing_day = get_credit_card_closing_day()

    conn = get_connection()
    cursor = conn.cursor()

    existing_columns = get_table_columns(conn, "transactions")

    if "reference_year" not in existing_columns:
        cursor.execute("ALTER TABLE transactions ADD COLUMN reference_year INTEGER")

    if "reference_month" not in existing_columns:
        cursor.execute("ALTER TABLE transactions ADD COLUMN reference_month INTEGER")

    if "recurring_id" not in existing_columns:
        cursor.execute("ALTER TABLE transactions ADD COLUMN recurring_id INTEGER")

    if is_postgres():
        conn.commit()
        conn.close()
        return

    # Backfill para registros antigos sem referência de competência.
    cursor.execute(
        """
        UPDATE transactions
        SET
            reference_year = CAST(strftime('%Y', CASE
                WHEN payment_method = 'cartao' AND CAST(strftime('%d', date) AS INTEGER) < ?
                THEN date(date, '-1 month')
                ELSE date
            END) AS INTEGER),
            reference_month = CAST(strftime('%m', CASE
                WHEN payment_method = 'cartao' AND CAST(strftime('%d', date) AS INTEGER) < ?
                THEN date(date, '-1 month')
                ELSE date
            END) AS INTEGER)
        WHERE reference_year IS NULL OR reference_month IS NULL
        """,
        (closing_day, closing_day),
    )

    conn.commit()
    conn.close()


def get_reference_period(date_str, payment_method, closing_day=None):
    date_obj = date_str if hasattr(date_str, "day") else datetime.strptime(str(date_str), "%Y-%m-%d")
    if is_credit_card_method(payment_method):
        method = get_payment_method(payment_method)
        closing_day = closing_day or (method and method["closing_day"]) or get_credit_card_closing_day()

    if is_credit_card_method(payment_method) and date_obj.day < closing_day:
        if date_obj.month == 1:
            return date_obj.year - 1, 12

        return date_obj.year, date_obj.month - 1

    return date_obj.year, date_obj.month


def refresh_all_transaction_references():
    ensure_transaction_reference_columns()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, date, payment_method FROM transactions")
    transactions = cursor.fetchall()

    for transaction in transactions:
        reference_year, reference_month = get_reference_period(
            transaction["date"],
            transaction["payment_method"]
        )

        cursor.execute(
            """
            UPDATE transactions
            SET reference_year = ?, reference_month = ?
            WHERE id = ?
            """,
            (reference_year, reference_month, transaction["id"]),
        )

    conn.commit()
    conn.close()

def create_transaction(data):
    ensure_transaction_reference_columns()

    reference_year, reference_month = get_reference_period(
        data["date"],
        data["payment_method"]
    )

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO transactions (description, value, type, payment_method, date, reference_year, reference_month, recurring_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data["description"],
        data["value"],
        data["type"],
        data["payment_method"],
        data["date"],
        reference_year,
        reference_month,
        data.get("recurring_id"),
    ))

    conn.commit()
    conn.close()

def delete_transaction(transaction_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
    conn.commit()
    conn.close()


def update_transaction(transaction_id, data):
    ensure_transaction_reference_columns()

    reference_year, reference_month = get_reference_period(
        data["date"],
        data["payment_method"]
    )

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE transactions
        SET description = ?, value = ?, type = ?, payment_method = ?, date = ?, reference_year = ?, reference_month = ?
        WHERE id = ?
    """, (
        data["description"],
        data["value"],
        data["type"],
        data["payment_method"],
        data["date"],
        reference_year,
        reference_month,
        transaction_id
    ))

    conn.commit()
    conn.close()
