from app.services.transaction_service import create_transaction

create_transaction({
    "description": "Aluguel",
    "value": 1200,
    "type": "fixos",
    "payment_method": "pix",
    "date": "2026-04-01"
})