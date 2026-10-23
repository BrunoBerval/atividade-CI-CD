<div align="center">

# ⚡ Back-end — Nomes & Idades

API REST com **FastAPI** e **SQLAlchemy**, desenvolvida com TDD.

<p>
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white" alt="SQLAlchemy">
  <img src="https://img.shields.io/badge/Pydantic-v2-E92063?style=for-the-badge&logo=pydantic&logoColor=white" alt="Pydantic">
</p>
<p>
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/Uvicorn-ASGI-2094F3?style=for-the-badge" alt="Uvicorn">
  <img src="https://img.shields.io/badge/Pytest-38_passing-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white" alt="Pytest">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
</p>

<img src="https://skillicons.dev/icons?i=py,fastapi,sqlite,docker&perline=4" alt="Tecnologias">

</div>

---

## 📋 Sumário

- [Como rodar](#-como-rodar)
- [Endpoints](#-endpoints)
- [Regras de negócio](#-regras-de-negócio)
- [Modelos (tabelas)](#-modelos-tabelas)
- [Configuração](#-configuração)
- [Testes](#-testes)
- [Estrutura](#-estrutura)

## ▶️ Como rodar

```bash
python -m venv .venv
.venv\Scripts\activate          # Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

| | |
|---|---|
| 🌐 API | http://localhost:8000 |
| 📖 Swagger UI | http://localhost:8000/docs |
| 📘 ReDoc | http://localhost:8000/redoc |

As tabelas são criadas automaticamente na inicialização. O arquivo do banco (`app.db`) nasce na pasta **de onde você roda o comando**.

## 🔌 Endpoints

### 👤 Nomes — `/names`

| Método | Rota | Descrição | Sucesso | Erros |
|:---:|---|---|:---:|:---:|
| `GET` | `/names` | Lista todos | `200` | — |
| `GET` | `/names/{id}` | Busca um | `200` | `404` |
| `POST` | `/names` | Cria | `201` | `422` |
| `PUT` | `/names/{id}` | Atualiza | `200` | `404` · `422` |
| `DELETE` | `/names/{id}` | Exclui | `204` | `404` |

### 🎂 Idades — `/ages`

| Método | Rota | Descrição | Sucesso | Erros |
|:---:|---|---|:---:|:---:|
| `GET` | `/ages` | Lista todas | `200` | — |
| `GET` | `/ages/{id}` | Busca uma | `200` | `404` |
| `POST` | `/ages` | Cria | `201` | `422` |
| `PUT` | `/ages/{id}` | Atualiza | `200` | `404` · `422` |
| `DELETE` | `/ages/{id}` | Exclui | `204` | `404` |

### Exemplos

```bash
# Criar um nome
curl -X POST http://localhost:8000/names \
  -H "Content-Type: application/json" \
  -d '{"name": "Maria"}'
# {"id":1,"name":"Maria"}

# Cadastrar uma data de nascimento — a idade vem calculada
curl -X POST http://localhost:8000/ages \
  -H "Content-Type: application/json" \
  -d '{"birth_date": "2000-05-10"}'
# {"id":1,"birth_date":"2000-05-10","age":26}
```

## 📐 Regras de negócio

- **Nome:** espaços nas pontas são removidos; não pode ficar vazio nem passar de 100 caracteres.
- **Data de nascimento:** formato `AAAA-MM-DD` e **não pode estar no futuro**.
- **Idade:** nunca é armazenada nem aceita do cliente. Ela é **calculada a cada leitura**, em anos completos, e por isso nunca fica desatualizada.
- **29/02:** em anos não bissextos, o aniversário conta a partir de 01/03.

## 🗄️ Modelos (tabelas)

Os models ficam dentro dos arquivos de rota, junto de cada recurso.

**`names`** — `name_routes.py`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `INTEGER` | chave primária |
| `name` | `VARCHAR(100)` | `NOT NULL` |

**`birth_dates`** — `age_routes.py`

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | `INTEGER` | chave primária |
| `birth_date` | `DATE` | `NOT NULL` |

## ⚙️ Configuração

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./app.db` | String de conexão do SQLAlchemy |

```bash
# SQLite em caminho absoluto (4 barras no Linux/Docker)
DATABASE_URL=sqlite:////data/app.db

# Outro banco: instale o driver e troque a URL
DATABASE_URL=postgresql+psycopg://usuario:senha@localhost/meubanco
```

> [!IMPORTANT]
> O CORS está liberado para `localhost:3000` e `localhost:5173`. Se o front-end rodar em outro endereço, ajuste `allow_origins` em `main.py`.

> [!NOTE]
> As tabelas são criadas com `create_all`, que **não altera** tabelas já existentes. Para evoluir o schema com segurança, use migrations (por exemplo, Alembic).

## 🧪 Testes

```bash
python -m pytest -v
```

**38 testes**, todos com banco SQLite em memória e isolado por teste:

| Arquivo | O que cobre |
|---|---|
| `tests/test_name_routes.py` | CRUD de nomes, validações e 404 |
| `tests/test_age_routes.py` | cálculo da idade (aniversário, bissexto, virada de ano) e CRUD |
| `tests/test_main.py` | registro das rotas no app |

## 📁 Estrutura

```text
back/
├── main.py            # app FastAPI, CORS e registro das rotas
├── database.py        # engine, sessão e Base do SQLAlchemy
├── name_routes.py     # model + schemas + CRUD de /names
├── age_routes.py      # model + schemas + CRUD de /ages + calculate_age()
├── tests/
│   ├── conftest.py
│   ├── test_name_routes.py
│   ├── test_age_routes.py
│   └── test_main.py
├── requirements.txt
├── pytest.ini
└── Dockerfile
```
