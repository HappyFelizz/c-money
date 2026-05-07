# C-Money 💰

Um aplicativo web para gerenciamento de transações financeiras pessoais com suporte a transações recorrentes e controle de salário.

## 🚀 Funcionalidades

- ✅ Adicionar e gerenciar transações
- ✅ Categorizar despesas (Fixas, Variáveis, Não essenciais, Assinaturas, Eventuais)
- ✅ Transações recorrentes automáticas
- ✅ Cálculo de saldo mensal
- ✅ Controle de salário e projeções
- ✅ Diferentes métodos de pagamento (PIX, Cartão, Dinheiro)
- ✅ Referência inteligente por mês de fatura (cartão de crédito)

## 📋 Requisitos

- Python 3.8+
- pip ou conda

## 💻 Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/HappyFelizz/c-money.git
cd c-money
```

2. **Crie um ambiente virtual:**
```bash
python -m venv venv
```

3. **Ative o ambiente virtual:**

No Linux/Mac:
```bash
source venv/bin/activate
```

No Windows:
```bash
venv\Scripts\activate
```

4. **Instale as dependências:**
```bash
pip install -r requirements.txt
```

5. **Inicialize o banco de dados:**
```bash
python -m app.database.init_db
```

## 🏃 Como Executar

```bash
python -m flask --app app.main run
```

A aplicação estará disponível em `http://localhost:5000`

## 🧪 Testes

Execute os testes com pytest:
```bash
pytest tests/
```

## 📁 Estrutura do Projeto

```
c-money/
├── app/
│   ├── __init__.py
│   ├── main.py              # Aplicação Flask
│   ├── database/
│   │   ├── db.py           # Conexão com banco de dados
│   │   └── init_db.py      # Schema do banco
│   ├── models/             # (Modelos ORM - future expansion)
│   ├── routes/             # Blueprints Flask
│   │   ├── home.py
│   │   ├── transaction_routes.py
│   │   └── recurring_routes.py
│   ├── services/           # Lógica de negócio
│   │   ├── transaction_service.py
│   │   ├── recurring_service.py
│   │   ├── salary_service.py
│   │   └── validations.py
│   ├── static/             # Arquivos estáticos
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   └── templates/          # Templates HTML
├── tests/                  # Testes
├── requirements.txt        # Dependências do projeto
└── README.md              # Este arquivo
```

## 🔧 Configuração

As configurações podem ser ajustadas diretamente no código. Futuramente, considere usar um arquivo `.env` com variáveis de ambiente.

## 📝 Uso da API

### Adicionar Transação
```bash
POST /transactions
Content-Type: application/json

{
  "description": "Compra no supermercado",
  "value": 150.50,
  "type": "variaveis_essenciais",
  "payment_method": "cartao",
  "date": "2026-05-04"
}
```

### Listar Transações do Mês
```bash
GET /transactions/2026/5
```

### Adicionar Transação Recorrente
```bash
POST /recurring
Content-Type: application/json

{
  "description": "Aluguel",
  "value": 1500.00,
  "type": "fixos",
  "payment_method": "pix",
  "day_of_month": 5
}
```

### Listar Transações Recorrentes
```bash
GET /recurring
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:
1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/FeatureTopDemais`)
3. Commit suas mudanças (`git commit -m 'Add some FeatureTopDemais'`)
4. Push para a branch (`git push origin feature/FeatureTopDemais`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👤 Autor

Luis Araujo - (Happy) / luis_gdm@outlook.com
