def validate_transaction(data):
    errors = []

    if not data.get("description"):
        errors.append("Descrição é obrigatória")

    if data.get("value") is None or data["value"] <= 0:
        errors.append("Valor deve ser maior que 0")

    if data.get("type") not in [
        "fixos",
        "variaveis_essenciais",
        "nao_essenciais",
        "assinaturas",
        "eventuais"
    ]:
        errors.append("Tipo inválido")

    if data.get("payment_method") not in ["pix", "cartao", "dinheiro"]:
        errors.append("Forma de pagamento inválida")

    if not data.get("date"):
        errors.append("Data é obrigatória")

    return errors


def validate_recurring_transaction(data):
    errors = []

    if not data.get("description"):
        errors.append("Descrição é obrigatória")

    if data.get("value") is None or data["value"] <= 0:
        errors.append("Valor deve ser maior que 0")

    if data.get("type") not in [
        "fixos",
        "variaveis_essenciais",
        "nao_essenciais",
        "assinaturas",
        "eventuais"
    ]:
        errors.append("Tipo inválido")

    if data.get("payment_method") not in ["pix", "cartao", "dinheiro"]:
        errors.append("Forma de pagamento inválida")

    if data.get("day_of_month") is None or data["day_of_month"] < 1 or data["day_of_month"] > 31:
        errors.append("Dia do mês deve estar entre 1 e 31")

    return errors