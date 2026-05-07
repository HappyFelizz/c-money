from datetime import datetime
from app.database.db import get_connection


def ensure_salary_tables():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS salary_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            monthly_salary REAL NOT NULL CHECK (monthly_salary >= 0),
            credit_card_closing_day INTEGER NOT NULL DEFAULT 4 CHECK (credit_card_closing_day >= 1 AND credit_card_closing_day <= 31),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("PRAGMA table_info(salary_settings)")
    columns = {row["name"] for row in cursor.fetchall()}

    if "credit_card_closing_day" not in columns:
        cursor.execute("""
            ALTER TABLE salary_settings
            ADD COLUMN credit_card_closing_day INTEGER NOT NULL DEFAULT 4
        """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS salary_projection (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            salary REAL NOT NULL CHECK (salary >= 0),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(year, month)
        )
    """)

    conn.commit()
    conn.close()


def _add_months(base_date, months_to_add):
    month_index = (base_date.month - 1) + months_to_add
    year = base_date.year + (month_index // 12)
    month = (month_index % 12) + 1
    return year, month


def get_months_projection():
    now = datetime.now()
    return [_add_months(now, offset) for offset in range(-1, 2)]


def get_financial_settings():
    ensure_salary_tables()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT monthly_salary, credit_card_closing_day
        FROM salary_settings
        WHERE id = 1
    """)
    row = cursor.fetchone()

    conn.close()

    if not row:
        return {
            "monthly_salary": 0.0,
            "credit_card_closing_day": 4,
        }

    return {
        "monthly_salary": float(row["monthly_salary"] or 0),
        "credit_card_closing_day": int(row["credit_card_closing_day"] or 4),
    }


def get_monthly_salary():
    return get_financial_settings()["monthly_salary"]


def get_credit_card_closing_day():
    return get_financial_settings()["credit_card_closing_day"]


def generate_salary_projection(monthly_salary):
    ensure_salary_tables()

    conn = get_connection()
    cursor = conn.cursor()

    for year, month in get_months_projection():
        cursor.execute("""
            INSERT INTO salary_projection (year, month, salary)
            VALUES (?, ?, ?)
            ON CONFLICT(year, month) DO UPDATE SET salary = excluded.salary
        """, (year, month, monthly_salary))

    conn.commit()
    conn.close()


def save_financial_settings(monthly_salary, credit_card_closing_day):
    ensure_salary_tables()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO salary_settings (id, monthly_salary, credit_card_closing_day)
        VALUES (1, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            monthly_salary = excluded.monthly_salary,
            credit_card_closing_day = excluded.credit_card_closing_day,
            updated_at = CURRENT_TIMESTAMP
    """, (monthly_salary, credit_card_closing_day))

    conn.commit()
    conn.close()

    generate_salary_projection(monthly_salary)


def save_monthly_salary(monthly_salary):
    credit_card_closing_day = get_credit_card_closing_day()
    save_financial_settings(monthly_salary, credit_card_closing_day)


def get_salary_for_month(year, month):
    ensure_salary_tables()

    monthly_salary = get_monthly_salary()

    if monthly_salary > 0:
        generate_salary_projection(monthly_salary)

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT salary
        FROM salary_projection
        WHERE year = ? AND month = ?
    """, (year, month))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return 0.0

    return float(row["salary"] or 0)


def get_projected_months_with_salary():
    ensure_salary_tables()

    months = get_months_projection()

    conn = get_connection()
    cursor = conn.cursor()

    result = []
    for year, month in months:
        cursor.execute("""
            SELECT salary
            FROM salary_projection
            WHERE year = ? AND month = ?
        """, (year, month))

        row = cursor.fetchone()
        salary = float(row["salary"] or 0) if row else 0.0

        result.append({
            "year": year,
            "month": month,
            "salary": salary,
        })

    conn.close()

    return result


def update_month_salary(year, month, salary):
    ensure_salary_tables()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO salary_projection (year, month, salary)
        VALUES (?, ?, ?)
        ON CONFLICT(year, month) DO UPDATE SET salary = excluded.salary
    """, (year, month, salary))

    conn.commit()
    conn.close()