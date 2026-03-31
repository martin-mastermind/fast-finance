# Fast Finance

Монорепозиторий Telegram Mini App для учета личных финансов.

## Стек

- Bun workspaces
- Frontend: Next.js 14, React 18, TailwindCSS
- Backend: Elysia, Drizzle ORM
- База данных: PostgreSQL 16

## Структура

- `apps/frontend` — клиентское приложение
- `apps/backend` — HTTP API
- `packages/db` — схема БД, миграции, сиды, клиент Drizzle
- `packages/shared` — общие типы/утилиты

## Требования

- Bun 1.1+
- Docker + Docker Compose (для локального Postgres)

## Переменные окружения

### Корень (`.env`)

Скопируйте `.env.example` в `.env`:

```bash
cp .env.example .env
```

Минимально нужно:

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fast_finance`
- `TELEGRAM_BOT_TOKEN=...`
- `NODE_ENV=development`
- `FRONTEND_URL=http://localhost:3000`

### Frontend (`apps/frontend/.env.local`)

Скопируйте `apps/frontend/.env.local.example` в `apps/frontend/.env.local`:

```bash
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

- `NEXT_PUBLIC_API_URL=http://localhost:3001`

## Быстрый старт (локально)

1. Установить зависимости:

```bash
bun install
```

2. Поднять Postgres:

```bash
docker compose up -d postgres
```

3. Применить схему БД:

```bash
bun run db:push
```

4. (Опционально) заполнить тестовыми данными:

```bash
bun run db:seed
```

5. Запустить frontend и backend:

```bash
bun run dev
```

По умолчанию:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Swagger: `http://localhost:3001/docs`
- Healthcheck: `http://localhost:3001/health`

## Скрипты

### Корень

- `bun run dev` — dev-режим для всех workspace
- `bun run build` — сборка всех workspace
- `bun run lint` — линт всех workspace
- `bun run test` — тесты всех workspace
- `bun run db:push` — применить схему в БД
- `bun run db:migrate` — выполнить миграции
- `bun run db:studio` — открыть Drizzle Studio
- `bun run db:seed` — сиды

### Backend (`apps/backend`)

- `bun run dev`
- `bun run build`
- `bun run start`
- `bun run test`
- `bun run test:watch`

### Frontend (`apps/frontend`)

- `bun run dev`
- `bun run build`
- `bun run start`
- `bun run lint`
- `bun run test`
- `bun run test:watch`

## API

Базовый URL: `http://localhost:3001`

Авторизация прикладных ручек через заголовок `x-user-id`.

- `POST /auth/telegram` — Telegram auth (`initData`)
- `GET /accounts` / `POST /accounts`
- `PATCH /accounts/:id` / `DELETE /accounts/:id`
- `GET /transactions?limit=&offset=`
- `POST /transactions`
- `DELETE /transactions/:id`
- `GET /categories`

Интерактивная спецификация: `GET /docs`.

## Тесты

Запустить все тесты:

```bash
bun run test
```

Только backend:

```bash
bun run --cwd apps/backend test
```

Только frontend:

```bash
bun run --cwd apps/frontend test
```

## Docker

Локально можно поднять backend + postgres:

```bash
docker compose up --build
```

Backend контейнер использует `apps/backend/Dockerfile`, слушает `3001`.

## Deploy

В репозитории есть `render.yaml`:

- сервис `fast-finance-backend` (Docker)
- сервис `fast-finance-frontend` (Static)
- база `fast-finance-db` (PostgreSQL)
