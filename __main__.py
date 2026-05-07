#!/usr/bin/env python
"""Ponto de entrada para executar a aplicação como módulo."""
from app.main import app

if __name__ == "__main__":
    app.run(debug=True)
