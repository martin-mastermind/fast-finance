# PRD: Fast Finance — Telegram Mini App (TMA)
## 1. Project Overview
Высокопроизводительное Fullstack-приложение для учета личных финансов, работающее внутри Telegram.
**Key Focus:** Скорость ввода, бесшовная авторизация и современный стек на базе Bun.
---
## 2. Tech Stack (The "Edge" Stack)
- **Runtime:** `Bun` — замена Node.js для максимальной скорости.
- **Backend:** `ElysiaJS` — сверхбыстрый фреймворк с нативной поддержкой TypeScript.
- **Frontend:** `Next.js` (App Router) + `Tailwind CSS`.
- **Database & ORM:** `PostgreSQL` + `Drizzle ORM`.
- **State Management:** `TanStack Query` (Server State) + `Zustand` (Client State).
- **UI Kit:** `Shadcn UI` + `Framer Motion` (анимации).
- **Safety:** `Eden Trellis` (E2E Type Safety между бэкендом и фронтендом).
- **Deployment:** `Render` (Dockerized Bun + Managed Postgres).
---
## 3. Core Architecture (Monorepo)
```text
/fast-finance
├── apps/
│   ├── backend/          # ElysiaJS API (Bun)
│   └── frontend/         # Next.js (TMA UI)
├── packages/
│   ├── db/               # Drizzle Schema & Migrations
│   └── shared/           # Common Types (TypeScript)
├── docker-compose.yml
├── render.yaml           # Infrastructure as Code
└── package.json          # Bun Workspaces
```
## 4. Database Schema (Drizzle ORM)
### Users
- `id`: serial, primary key
- `telegram_id`: bigint, unique (идентификатор из Telegram)
- `username`: text
- `currency`: text (стандартная валюта пользователя, по умолчанию 'RUB')
- `created_at`: timestamp
### Accounts
- `id`: serial, primary key
- `user_id`: references users.id
- `name`: text (название: "Карта", "Наличные")
- `balance`: double precision (текущий остаток, по умолчанию 0)
### Transactions
- `id`: uuid, default gen_random_uuid()
- `user_id`: references users.id
- `account_id`: references accounts.id
- `category_id`: references categories.id
- `amount`: double precision (отрицательное для расходов, положительное для доходов)
- `description`: text
- `date`: timestamp (по умолчанию now)
### Categories
- `id`: serial, pk
- `name`: text
- `icon`: text (название иконки из Lucide)
- `type`: text ('income' | 'expense')
---
## 5. Key Implementation Rules (For AI)
### A. Telegram Auth (Priority #1)
Бэкенд на ElysiaJS должен валидировать `hash` из `window.Telegram.WebApp.initData`.
- Реализовать проверку подписи с использованием `BOT_TOKEN` и `Bun.crypto.hmac`.
- Если пользователя нет в базе — автоматически создавать запись (Auto-registration).
### B. Smart Input (NLP Lite)
Добавить логику быстрого распознавания текста:
- Парсинг строки: `"500 кофе"` -> `{ amount: -500, category: "Еда", description: "кофе" }`.
- Использовать Regex-паттерны или легкий промпт к LLM (Groq/OpenAI) для распределения по категориям.
### C. TMA Native Integration
- Использовать `@twa-dev/sdk`.
- CSS-переменные: привязать цвета темы Shadcn UI к переменным Telegram (`--tg-theme-bg-color`, `--tg-theme-button-color`).
- Виброотклик: вызывать `HapticFeedback` при успешном сохранении транзакций.
---
## 6. Infrastructure (render.yaml)
```yaml
services:
 - type: web
   name: api-backend
   runtime: docker
   dockerContext: .
   dockerfilePath: apps/backend/Dockerfile
   envVars:
     - key: DATABASE_URL
       fromDatabase:
         name: finance-db
         property: connectionString
     - key: TELEGRAM_BOT_TOKEN
       sync: false
 - type: web
   name: tma-frontend
   runtime: static
   buildCommand: bun run build
   staticPublishPath: apps/frontend/out
databases:
 - name: finance-db
   plan: free
```