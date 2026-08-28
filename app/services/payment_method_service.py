import re

from app.database.db import get_connection, get_table_columns, is_postgres

DEFAULT_PAYMENT_METHODS = [
    ("pix", "Pix", "other", None),
    ("cartao", "Cartão", "credit_card", 4),
    ("dinheiro", "Dinheiro", "other", None),
    ("boleto", "Boleto", "other", None),
]


def ensure_payment_methods_table():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS payment_methods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL UNIQUE,
            method_type TEXT NOT NULL DEFAULT 'other',
            closing_day INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    columns = get_table_columns(conn, "payment_methods")
    if "closing_day" not in columns:
        cursor.execute("ALTER TABLE payment_methods ADD COLUMN closing_day INTEGER")
    cursor.executemany(
        "INSERT OR IGNORE INTO payment_methods (code, name, method_type, closing_day) VALUES (?, ?, ?, ?)",
        DEFAULT_PAYMENT_METHODS,
    )
    cursor.execute("UPDATE payment_methods SET closing_day = 4 WHERE method_type = 'credit_card' AND closing_day IS NULL")
    conn.commit()
    conn.close()


def get_payment_methods():
    ensure_payment_methods_table()
    conn = get_connection()
    rows = conn.execute(
        "SELECT code, name, method_type, closing_day FROM payment_methods ORDER BY id ASC"
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def add_payment_method(name, method_type, closing_day=None):
    ensure_payment_methods_table()
    clean_name = " ".join(str(name).strip().split())
    if not clean_name or clean_name == "None":
        raise ValueError("Informe o nome da forma de pagamento")
    if method_type not in ("credit_card", "other"):
        raise ValueError("Tipo de pagamento inválido")
    if method_type == "credit_card":
        try:
            closing_day = int(closing_day)
        except (TypeError, ValueError):
            raise ValueError("Informe um dia de fechamento válido")
        if closing_day < 1 or closing_day > 31:
            raise ValueError("O dia de fechamento deve estar entre 1 e 31")
    else:
        closing_day = None

    code = "custom_" + re.sub(r"[^a-z0-9]+", "_", clean_name.lower()).strip("_")
    conn = get_connection()
    cursor = conn.cursor()
    insert_sql = "INSERT INTO payment_methods (code, name, method_type, closing_day) VALUES (?, ?, ?, ?)"
    if is_postgres():
        insert_sql += " RETURNING code, name, method_type, closing_day"
    cursor.execute(insert_sql, (code, clean_name, method_type, closing_day))
    created = cursor.fetchone() if is_postgres() else None
    conn.commit()
    if not created:
        created = cursor.execute(
            "SELECT code, name, method_type, closing_day FROM payment_methods WHERE id = last_insert_rowid()"
        ).fetchone()
    conn.close()
    return dict(created)


def update_payment_method(code, closing_day):
    ensure_payment_methods_table()
    method = get_payment_method(code)
    if not method or method["method_type"] != "credit_card":
        raise ValueError("Apenas cartões de crédito podem ter o fechamento alterado")
    try:
        closing_day = int(closing_day)
    except (TypeError, ValueError):
        raise ValueError("Informe um dia de fechamento válido")
    if closing_day < 1 or closing_day > 31:
        raise ValueError("O dia de fechamento deve estar entre 1 e 31")

    conn = get_connection()
    conn.execute("UPDATE payment_methods SET closing_day = ? WHERE code = ?", (closing_day, code))
    conn.commit()
    conn.close()


def delete_payment_method(code):
    ensure_payment_methods_table()
    if code in {item[0] for item in DEFAULT_PAYMENT_METHODS}:
        raise ValueError("As formas de pagamento padrão não podem ser removidas")
    conn = get_connection()
    conn.execute("DELETE FROM payment_methods WHERE code = ?", (code,))
    conn.commit()
    conn.close()


def is_credit_card_method(code):
    method = get_payment_method(code)
    return bool(method and method["method_type"] == "credit_card")


def get_payment_method(code):
    conn = get_connection()
    row = conn.execute(
        "SELECT code, name, method_type, closing_day FROM payment_methods WHERE code = ?",
        (code,),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def get_payment_method_closing_day(code, fallback):
    method = get_payment_method(code)
    return int(method["closing_day"]) if method and method["closing_day"] else fallback
