from app.database.db import get_connection

def show_all_transactions():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM transactions")
    rows = cursor.fetchall()

    for row in rows:
        data = dict(row)
        print(f"""
            ID: {data['id']}
            Descrição: {data['description']}
            Valor: R$ {data['value']}
            Tipo: {data['type']}
            Pagamento: {data['payment_method']}
            Data: {data['date']}
            ---------------------------
            """)
    conn.close()

if __name__ == "__main__":
    show_all_transactions()