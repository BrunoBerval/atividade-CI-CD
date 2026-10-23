<div align="center">

# 🧑‍🤝‍🧑 Nomes & Idades

**Cadastre nomes e datas de nascimento — o backend calcula a idade.**
CRUD completo, testes automatizados e tudo rodando com um único comando.

<p>
  <a href="https://github.com/SEU_USUARIO/SEU_REPO/actions/workflows/ci.yml"><img src="https://github.com/SEU_USUARIO/SEU_REPO/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/backend_tests-38_passing-brightgreen?style=flat-square&logo=pytest&logoColor=white" alt="Backend tests">
  <img src="https://img.shields.io/badge/frontend_tests-14_passing-brightgreen?style=flat-square&logo=vitest&logoColor=white" alt="Frontend tests">
  <img src="https://img.shields.io/badge/docker-compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker Compose">
</p>

<p>
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white" alt="SQLAlchemy">
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
</p>
<p>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest">
</p>
<p>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" alt="Nginx">
  <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions">
</p>

<img src="https://skillicons.dev/icons?i=py,fastapi,sqlite,react,ts,vite,docker,nginx,githubactions&perline=9" alt="Tecnologias">

</div>

---

## ✨ Visão geral

| | |
|---|---|
| 👤 **Nomes** | cadastrar, listar, consultar, editar e excluir |
| 🎂 **Idades** | o usuário informa a **data de nascimento** e o backend calcula a **idade** |
| 🧪 **Qualidade** | desenvolvido com TDD · 38 testes no backend · 14 testes de integração no front |
| 🐳 **Docker** | `docker compose up --build` e pronto |
| 🤖 **CI/CD** | pipeline no GitHub Actions: testes, lint, build e deploy |

## 🏗️ Arquitetura

```mermaid
flowchart LR
    U([👤 Navegador]) -->|http://localhost:3000| F["⚛️ Front-end<br/>React + Vite<br/>(servido pelo Nginx)"]
    U -->|"fetch · http://localhost:8000"| B["⚡ Back-end<br/>FastAPI + SQLAlchemy"]
    B --> D[("🗄️ SQLite<br/>volume db_data")]
```

## 🚀 Início rápido (Docker)

Pré-requisito: [Docker](https://docs.docker.com/get-docker/) com Docker Compose.

```bash
docker compose up --build
```

| Serviço | URL |
|---|---|
| 🖥️ Aplicação (front-end) | http://localhost:3000 |
| ⚡ API | http://localhost:8000 |
| 📖 Documentação interativa (Swagger) | http://localhost:8000/docs |

Os dados ficam no volume `db_data` e **sobrevivem** a `docker compose down`.
Para apagar tudo, inclusive o banco: `docker compose down -v`.

## 🛠️ Rodando sem Docker

<details>
<summary><b>Clique para expandir</b></summary>

**Back-end** (Python 3.12+)

```bash
cd back
python -m venv .venv
.venv\Scripts\activate          # Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Front-end** (Node 22+), em outro terminal:

```bash
cd front
npm install
npm run dev
```

Detalhes em [`back/README.md`](back/README.md) e [`front/README.md`](front/README.md).

</details>

## 🧪 Testes

```bash
# back-end
cd back && python -m pytest

# front-end
cd front && npm test
```

## 🔄 CI/CD

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda a cada Pull Request e a cada push na `main`:

```mermaid
flowchart LR
    A[🐍 Backend<br/>pytest + smoke test] --> D
    B[⚛️ Frontend<br/>lint · testes · build] --> D
    D{{"🚀 Deploy<br/>somente na main"}}
```

> [!NOTE]
> O passo de deploy é um modelo: troque-o pelo seu destino de publicação.
> Para ativar o badge de CI no topo, substitua `SEU_USUARIO/SEU_REPO` pelo caminho do seu repositório.

## 📁 Estrutura do projeto

```text
.
├── 📄 docker-compose.yml
├── 📂 .github/workflows/
│   └── ci.yml
├── 📂 back/                 ⚡ API FastAPI
│   ├── main.py
│   ├── database.py
│   ├── name_routes.py
│   ├── age_routes.py
│   ├── tests/
│   └── Dockerfile
└── 📂 front/                ⚛️ Interface React
    ├── src/
    │   ├── App.tsx
    │   └── App.integration.test.tsx
    ├── nginx.conf
    └── Dockerfile
```

## 🔌 Resumo da API

| Recurso | Endpoints |
|---|---|
| 👤 **Nomes** | `GET /names` · `GET /names/{id}` · `POST /names` · `PUT /names/{id}` · `DELETE /names/{id}` |
| 🎂 **Idades** | `GET /ages` · `GET /ages/{id}` · `POST /ages` · `PUT /ages/{id}` · `DELETE /ages/{id}` |

Referência completa em [`back/README.md`](back/README.md).
