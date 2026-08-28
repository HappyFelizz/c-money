import sqlite3
import os

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:
    psycopg = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "c_money.db")
DATABASE_URL = os.getenv("DATABASE_URL")


def is_postgres():
    return bool(DATABASE_URL)


def adapt_sql(sql):
    if not is_postgres():
        return sql
    return (sql.replace("?", "%s")
            .replace("INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY")
            .replace("BOOLEAN DEFAULT 1", "BOOLEAN DEFAULT TRUE")
            .replace("active = 1", "active = TRUE")
            .replace("INSERT OR IGNORE INTO payment_methods (code, name, method_type, closing_day) VALUES (%s, %s, %s, %s)", "INSERT INTO payment_methods (code, name, method_type, closing_day) VALUES (%s, %s, %s, %s) ON CONFLICT (code) DO NOTHING"))


class _CursorProxy:
    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, sql, parameters=None):
        return self._cursor.execute(adapt_sql(sql), parameters)

    def executemany(self, sql, parameters):
        return self._cursor.executemany(adapt_sql(sql), parameters)

    def __getattr__(self, name):
        return getattr(self._cursor, name)


class _ConnectionProxy:
    def __init__(self, connection):
        self._connection = connection

    def cursor(self):
        return _CursorProxy(self._connection.cursor())

    def execute(self, sql, parameters=None):
        return _CursorProxy(self._connection.cursor()).execute(sql, parameters)

    def __getattr__(self, name):
        return getattr(self._connection, name)

def get_connection():
    if is_postgres():
        if psycopg is None:
            raise RuntimeError("Instale psycopg[binary] para usar PostgreSQL")
        return _ConnectionProxy(psycopg.connect(DATABASE_URL, row_factory=dict_row))
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_table_columns(conn, table_name):
    if is_postgres():
        rows = conn.execute(
            """
            SELECT column_name AS name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            """,
            (table_name,),
        ).fetchall()
    else:
        rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    return {row["name"] for row in rows}