<div align="center">

# ⚛️ Front-end — Nomes & Idades

Interface em **React + TypeScript** integrada à API, com testes de integração.

<p>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Node.js-22-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
</p>
<p>
  <img src="https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest">
  <img src="https://img.shields.io/badge/Testing_Library-E33332?style=for-the-badge&logo=testinglibrary&logoColor=white" alt="Testing Library">
  <img src="https://img.shields.io/badge/MSW-FF6A33?style=for-the-badge&logo=mockserviceworker&logoColor=white" alt="MSW">
  <img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint">
</p>
<p>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" alt="Nginx">
  <img src="https://img.shields.io/badge/testes-14_passing-brightgreen?style=for-the-badge" alt="Testes">
</p>

<img src="https://skillicons.dev/icons?i=react,ts,vite,nodejs,vitest,eslint,docker,nginx&perline=8" alt="Tecnologias">

</div>

---

## 📋 Sumário

- [Funcionalidades](#-funcionalidades)
- [Como rodar](#-como-rodar)
- [Scripts](#-scripts)
- [Testes de integração](#-testes-de-integração)
- [Configuração da API](#-configuração-da-api)
- [Docker](#-docker)
- [Estrutura](#-estrutura)

## ✨ Funcionalidades

Uma tela com duas colunas, **Nomes** e **Idades**. Em cada uma você pode:

- ➕ **Cadastrar**: para idades, escolha a data de nascimento e a idade aparece calculada pelo backend
- ✏️ **Editar** na própria lista (com opção de cancelar)
- 🗑️ **Excluir**, com confirmação
- ⚠️ Ver **mensagens de erro** claras: validação do backend (422), registro inexistente (404) ou backend fora do ar
- ♿ Navegar com **leitor de tela**: seções e campos têm rótulos de acessibilidade
- 🌗 Tema claro e escuro automáticos

## ▶️ Como rodar

Pré-requisito: **Node 22+** e o [back-end](../back/README.md) rodando em `http://localhost:8000`.

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar (normalmente http://localhost:5173).

## 📜 Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento com hot reload |
| `npm run build` | verifica os tipos e gera o build de produção em `dist/` |
| `npm run lint` | análise estática do código |
| `npm test` | roda os testes de integração uma vez |

## 🧪 Testes de integração

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw
npm test
```

Os testes renderizam o `<App />` inteiro e simulam o que o usuário faz: digitar, clicar e ver a lista atualizar. **Só a rede é simulada**: o [MSW](https://mswjs.io/) intercepta o `fetch` e responde como o FastAPI responderia, com validações, `404` e `422` de verdade.

**14 testes** cobrem:

| Área | Cenários |
|---|---|
| 📥 Carga inicial | listas vazias; listas com dados e idade calculada |
| 👤 Nomes | cadastrar, editar, cancelar edição, excluir, cancelar exclusão |
| 🎂 Idades | cadastrar, atualizar e recalcular, excluir, bloqueio de datas futuras |
| ⚠️ Erros | `422` do backend, `404` ao editar, backend fora do ar sem derrubar a outra seção |

> [!TIP]
> O servidor falso falha o teste se o app chamar uma rota que não foi simulada (`onUnhandledFrame: 'error'`), o que evita falsos positivos.

## 🔗 Configuração da API

O endereço do backend fica no topo do `src/App.tsx`:

```ts
const API_URL = "http://localhost:8000";
```

Ao publicar em outro servidor, altere esse valor e a lista `allow_origins` do CORS no `back/main.py`.

## 🐳 Docker

O `Dockerfile` usa duas etapas: compila com Node e serve o `dist/` com Nginx, já com fallback de rotas para o `index.html`.

```bash
# Pela raiz do projeto, junto com o back-end:
docker compose up --build
```

A aplicação fica em http://localhost:3000.

## 📁 Estrutura

```text
front/
├── src/
│   ├── App.tsx                      # tela, cliente da API e CRUD
│   ├── App.integration.test.tsx     # testes de integração
│   └── test/
│       ├── server.ts                # backend falso (MSW) em memória
│       └── setup.ts                 # configuração do Vitest
├── vite.config.ts                   # Vite + configuração dos testes
├── nginx.conf                       # servidor do container
├── Dockerfile
└── package.json
```
