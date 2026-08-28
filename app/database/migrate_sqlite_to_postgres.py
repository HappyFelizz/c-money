import os
import sqlite3

import psycopg

from app.database.db import DB_PATH

TABLES = {
    "payment_methods": ["id", "code", "name", "method_type", "closing_day", "created_at"],
    "salary_settings": ["id", "monthly_salary", "credit_card_closing_day", "updated_at"],
    "salary_projection": ["id", "year", "month", "salary", "created_at"],
    "recurring_transactions": ["id", "description", "value", "type", "payment_method", "day_of_month", "active", "created_at"],
    "transactions": ["id", "description", "value", "type", "payment_method", "date", "reference_year", "reference_month", "recurring_id", "created_at"],
    "additional_income": ["id", "description", "value", "date", "created_at"],
}
SERIAL_TABLES = {"payment_methods", "salary_projection", "recurring_transactions", "transactions", "additional_income"}


def migrate():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("Defina DATABASE_URL com a conexão do PostgreSQL antes de migrar.")

    sqlite_conn = sqlite3.connect(DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row

    # Importar inicializa o esquema PostgreSQL usando DATABASE_URL.
    from app.database import init_db  # noqa: F401

    postgres_conn = psycopg.connect(database_url)
    try:
        for table, columns in TABLES.items():
            available = {row["name"] for row in sqlite_conn.execute(f"PRAGMA table_info({table})")}
            if not available:
                continue

            selected_columns = [column for column in columns if column in available]
            placeholders = ", ".join(["%s"] * len(selected_columns))
            column_sql = ", ".join(selected_columns)
            rows = sqlite_conn.execute(f"SELECT {column_sql} FROM {table}").fetchall()

            with postgres_conn.cursor() as cursor:
                cursor.executemany(
                    f"INSERT INTO {table} ({column_sql}) VALUES ({placeholders}) ON CONFLICT DO NOTHING",
                    [tuple(row[column] for column in selected_columns) for row in rows],
                )

            if "id" in selected_columns and table in SERIAL_TABLES:
                with postgres_conn.cursor() as cursor:
                    cursor.execute(
                        f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE((SELECT MAX(id) FROM {table}), 1), true)"
                    )

        postgres_conn.commit()
    finally:
        postgres_conn.close()
        sqlite_conn.close()

    print("Migração do SQLite para PostgreSQL concluída com sucesso!")


if __name__ == "__main__":
    migrate()
