from app.services.validations import (
    validate_recurring_transaction,
    validate_transaction,
)


def test_validate_transaction_accepts_valid_data():
    data = {
        "description": "Aluguel",
        "value": 1200,
        "type": "fixos",
        "payment_method": "pix",
        "date": "2026-04-01",
    }

    assert validate_transaction(data) == []


def test_validate_transaction_reports_invalid_data():
    errors = validate_transaction({})

    assert "Descrição é obrigatória" in errors
    assert "Valor deve ser maior que 0" in errors
    assert "Tipo inválido" in errors
    assert "Forma de pagamento inválida" in errors
    assert "Data é obrigatória" in errors


def test_validate_recurring_transaction_accepts_valid_data():
    data = {
        "description": "Internet",
        "value": 100,
        "type": "assinaturas",
        "payment_method": "cartao",
        "day_of_month": 10,
    }

    assert validate_recurring_transaction(data) == []


def test_validate_recurring_transaction_rejects_invalid_day():
    data = {
        "description": "Internet",
        "value": 100,
        "type": "assinaturas",
        "payment_method": "cartao",
        "day_of_month": 32,
    }

    assert "Dia do mês deve estar entre 1 e 31" in validate_recurring_transaction(data)
