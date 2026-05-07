from app.database.db import get_connection

conn = get_connection()
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    value REAL NOT NULL CHECK(value >= 0),
    type TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    date DATE NOT NULL,
    reference_year INTEGER,
    reference_month INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

cursor.execute("""
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    value REAL NOT NULL CHECK(value >= 0),
    type TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    day_of_month INTEGER NOT NULL CHECK(day_of_month >= 1 AND day_of_month <= 31),
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS salary_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    monthly_salary REAL NOT NULL CHECK(monthly_salary >= 0),
    credit_card_closing_day INTEGER NOT NULL DEFAULT 4 CHECK(credit_card_closing_day >= 1 AND credit_card_closing_day <= 31),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS salary_projection (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    salary REAL NOT NULL CHECK(salary >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, month)
);
""")

conn.commit()
conn.close()

print("Banco criado com sucesso!")