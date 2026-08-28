from datetime import date

from app.database.db import get_connection, is_postgres


def ensure_income_table():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS additional_income (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            value REAL NOT NULL CHECK(value >= 0),
            date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def get_income_for_month(year, month):
    ensure_income_table()
    first_day = date(int(year), int(month), 1)
    next_month = date(int(year) + (int(month) == 12), (int(month) % 12) + 1, 1)
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT id, description, value, date
        FROM additional_income
        WHERE date >= ? AND date < ?
        ORDER BY date ASC, id ASC
        """,
        (first_day, next_month),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def create_income(data):
    ensure_income_table()
    if not data.get("description"):
        raise ValueError("Informe uma descrição")
    if data.get("value") is None or float(data["value"]) <= 0:
        raise ValueError("O valor deve ser maior que 0")
    if not data.get("date"):
        raise ValueError("Informe uma data")

    conn = get_connection()
    cursor = conn.cursor()
    insert_sql = "INSERT INTO additional_income (description, value, date) VALUES (?, ?, ?)"
    if is_postgres():
        insert_sql += " RETURNING id"
    cursor.execute(insert_sql, (data["description"].strip(), float(data["value"]), data["date"]))
    conn.commit()
    income_id = cursor.fetchone()["id"] if is_postgres() else cursor.lastrowid
    conn.close()
    return income_id


def delete_income(income_id):
    ensure_income_table()
    conn = get_connection()
    conn.execute("DELETE FROM additional_income WHERE id = ?", (income_id,))
    conn.commit()
    conn.close()


def update_income(income_id, data):
    ensure_income_table()
    if not data.get("description"):
        raise ValueError("Informe uma descrição")
    if data.get("value") is None or float(data["value"]) <= 0:
        raise ValueError("O valor deve ser maior que 0")
    if not data.get("date"):
        raise ValueError("Informe uma data")

    conn = get_connection()
    conn.execute(
        "UPDATE additional_income SET description = ?, value = ?, date = ? WHERE id = ?",
        (data["description"].strip(), float(data["value"]), data["date"], income_id),
    )
    conn.commit()
    conn.close()
