# C-Money 💰

Aplicativo fullstack para gerenciamento de transações financeiras pessoais, com suporte a transações recorrentes e controle de salário.

## 🚀 Funcionalidades

- ✅ Adicionar e gerenciar transações
- ✅ Categorizar despesas (Fixas, Variáveis, Não essenciais, Assinaturas, Eventuais)
- ✅ Transações recorrentes automáticas
- ✅ Cálculo de saldo mensal
- ✅ Controle de salário e projeções
- ✅ Cadastro de entradas extras por data e descrição
- ✅ Diferentes métodos de pagamento (PIX, Cartão, Dinheiro)
- ✅ Formas de pagamento personalizadas (ex.: Cartão Santander, Boleto)
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
.\venv\Scripts\Activate.ps1
```

4. **Instale as dependências:**
```bash
pip install -r requirements.txt
```

5. **Inicialize o banco de dados:**
```bash
python -m app.database.init_db
```

6. **Instale as dependências do frontend:**
```bash
cd frontend
npm install
cd ..
```

## 🏃 Como Executar

Inicie o backend em um terminal:
```bash
python -m flask --app app.main run
```

Em outro terminal, inicie o frontend:
```bash
cd frontend
npm run dev
```

A interface estará disponível em `http://localhost:5173` e a API em `http://localhost:5000`.

## 🌐 Deploy

O backend pode ser publicado no Azure App Service usando Gunicorn e PostgreSQL. No Azure, configure `DATABASE_URL` com a conexão do banco e `FRONTEND_URL` com a URL pública do GitHub Pages.

Para publicar o frontend, use o workflow `.github/workflows/deploy-pages.yml`. No repositório GitHub, configure Pages com **Source: GitHub Actions** e crie o secret `VITE_API_URL` com a URL pública da API Azure.

Os arquivos `.env.example` mostram as variáveis necessárias. Nunca publique arquivos `.env` ou credenciais no repositório.

### Migrar um banco existente (opcional)

Como o deploy usa um PostgreSQL novo e vazio, não execute este comando no fluxo normal. Ele só deve ser usado se você decidir copiar os dados do SQLite local:
```bash
python -m app.database.migrate_sqlite_to_postgres
```

O comando cria o esquema PostgreSQL, copia os dados do SQLite local e preserva os IDs para manter as relações entre recorrências e transações.

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
│   ├── models/             # Reservado para modelos futuros
│   ├── routes/             # Blueprints Flask
│   │   ├── home.py
│   │   ├── transaction_routes.py
│   │   └── recurring_routes.py
│   ├── services/           # Lógica de negócio
│   │   ├── transaction_service.py
│   │   ├── recurring_service.py
│   │   ├── salary_service.py
│   │   └── validations.py
│   └── __init__.py
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── components/     # Componentes da interface
│   │   ├── services/       # Comunicação com a API
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   └── vite.config.js
├── tests/                  # Testes
├── requirements.txt        # Dependências do projeto
└── README.md              # Este arquivo
```

## 🔧 Arquitetura

O Flask funciona como API e gerencia as regras de negócio e o banco SQLite. O React, executado pelo Vite, fornece a interface e consome os endpoints do Flask por meio do proxy de desenvolvimento.

As formas de pagamento podem ser gerenciadas em **Configurações**. Os métodos padrão são Pix, Cartão, Dinheiro e Boleto. Novos métodos podem ser cadastrados como “Outro” ou “Cartão de crédito”; cartões personalizados continuam usando o dia de fechamento configurado.

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

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👤 Autor

Luis Araujo - (Happy) / luis_gdm@outlook.com
