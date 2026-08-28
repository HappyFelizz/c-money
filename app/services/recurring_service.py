from app.database.db import get_connection
from datetime import date, datetime, timedelta
from app.services.transaction_service import create_transaction, refresh_all_transaction_references
import calendar

def create_recurring_transaction(data):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO recurring_transactions (description, value, type, payment_method, day_of_month)
        VALUES (?, ?, ?, ?, ?)
    """, (
        data["description"],
        data["value"],
        data["type"],
        data["payment_method"],
        data["day_of_month"]
    ))

    conn.commit()
    conn.close()


def get_recurring_transactions():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM recurring_transactions
        WHERE active = 1
        ORDER BY day_of_month ASC
    """)

    data = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return data


def delete_recurring_transaction(recurring_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM recurring_transactions WHERE id = ?", (recurring_id,))
    conn.commit()
    conn.close()


def update_recurring_transaction(recurring_id, data):
    conn = get_connection()
    cursor = conn.cursor()

    previous = cursor.execute(
        "SELECT description, value, type, payment_method FROM recurring_transactions WHERE id = ?",
        (recurring_id,),
    ).fetchone()

    cursor.execute("""
        UPDATE recurring_transactions
        SET description = ?, value = ?, type = ?, payment_method = ?, day_of_month = ?
        WHERE id = ?
    """, (
        data["description"],
        data["value"],
        data["type"],
        data["payment_method"],
        data["day_of_month"],
        recurring_id
    ))

    conn.commit()

    # Atualiza apenas ocorrências futuras vinculadas a esta recorrência.
    cursor.execute(
        """
        UPDATE transactions
        SET payment_method = ?
        WHERE recurring_id = ? AND date >= ?
        """,
        (data["payment_method"], recurring_id, date.today().isoformat()),
    )

    # Compatibilidade com ocorrências geradas antes da coluna recurring_id.
    if previous:
        cursor.execute(
            """
            UPDATE transactions
            SET payment_method = ?
            WHERE recurring_id IS NULL
              AND description = ? AND value = ? AND type = ?
              AND payment_method = ? AND date >= ?
            """,
            (
                data["payment_method"],
                previous["description"],
                previous["value"],
                previous["type"],
                previous["payment_method"],
                date.today().isoformat(),
            ),
        )

    conn.commit()
    conn.close()


def generate_recurring_transactions():
    
    #Gera transações automáticas para o mês vigente e +2 meses no futuro
    
    recurring = get_recurring_transactions()

    if not recurring:
        return

    now = datetime.now()
    months_to_generate = [now, now + timedelta(days=30), now + timedelta(days=60)]

    for month_offset in months_to_generate:
        year = month_offset.year
        month = month_offset.month

        for rec in recurring:
            day_of_month = rec["day_of_month"]

            # Validar se o dia existe no mês
            last_day_of_month = calendar.monthrange(year, month)[1]
            if day_of_month > last_day_of_month:
                day_of_month = last_day_of_month

            date_str = f"{year:04d}-{month:02d}-{day_of_month:02d}"

            conn = get_connection()
            conn.execute(
                """
                UPDATE transactions
                SET payment_method = ?, recurring_id = ?
                WHERE description = ? AND value = ? AND type = ?
                  AND date = ?
                  AND (recurring_id = ? OR recurring_id IS NULL)
                """,
                (
                    rec["payment_method"],
                    rec["id"],
                    rec["description"],
                    rec["value"],
                    rec["type"],
                    date_str,
                    rec["id"],
                ),
            )
            conn.commit()
            conn.close()

            # Verificar se a transação já existe
            conn = get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                SELECT id FROM transactions
                WHERE description = ?
                AND value = ?
                AND date = ?
                AND type = ?
                AND (recurring_id = ? OR recurring_id IS NULL)
            """, (rec["description"], rec["value"], date_str, rec["type"], rec["id"]))

            existing = cursor.fetchone()
            conn.close()

            if not existing:
                # Criar a transação
                create_transaction({
                    "description": rec["description"],
                    "value": rec["value"],
                    "type": rec["type"],
                    "payment_method": rec["payment_method"],
                    "date": date_str,
                    "recurring_id": rec["id"],
                })

    refresh_all_transaction_references()
