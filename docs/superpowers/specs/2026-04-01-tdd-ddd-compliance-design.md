# TDD/DDD Compliance — Design Spec

**Goal:** Привести проект fast-finance к соответствию TDD (London School) и прагматичному DDD: вынести бизнес-логику из роутов в domain-сервисы и закрыть все пробелы тестового покрытия.

**Architecture:** Добавляем тонкий domain-слой (`apps/backend/src/domain/`) с двумя сервисами. Роуты становятся тонкими оркестраторами: валидация → сервис → ответ. Фронтенд получает тесты сторов и ключевых компонентов через vitest + React Testing Library.

**Tech Stack:** Bun test (бэкенд), Vitest + @testing-library/react (фронтенд), Elysia, Drizzle ORM, Zustand, Next.js 14

---

## Архитектура

### Новые файлы — бэкенд

```
apps/backend/src/
  domain/
    account.service.ts        ← CRUD аккаунтов, проверка ownership
    transaction.service.ts    ← создание/удаление транзакций + баланс
  __tests__/
    domain/
      account.service.test.ts
      transaction.service.test.ts
    routes/
      auth.test.ts            ← новый (было пропущено)
      categories.test.ts      ← новый (было пропущено)
      accounts.test.ts        ← существующий + PATCH тест
```

### Новые файлы — фронтенд

```
apps/frontend/
  __tests__/
    store/
      auth.test.ts
      finance.test.ts
    components/
      dashboard.test.tsx
      add-transaction.test.tsx
```

### Изменяемые файлы

- `apps/backend/src/routes/accounts.ts` — делегирует в AccountService
- `apps/backend/src/routes/transactions.ts` — делегирует в TransactionService
- `apps/frontend/package.json` — добавить vitest, @testing-library/react, @testing-library/jest-dom

---

## Интерфейсы Domain-сервисов

### AccountService (`domain/account.service.ts`)

```typescript
export const AccountService = {
  getAccounts(userId: number): Promise<Account[]>
  createAccount(userId: number, name: string, balance?: number): Promise<Account>
  updateAccount(userId: number, id: number, data: { name?: string; balance?: number }): Promise<Account | null>
  deleteAccount(userId: number, id: number): Promise<void>
}
```

### TransactionService (`domain/transaction.service.ts`)

```typescript
export interface NewTransactionInput {
  accountId: number
  categoryId: number
  amount: number
  description?: string
  date?: string
}

export const TransactionService = {
  getTransactions(userId: number, limit: number, offset: number): Promise<{ items: Transaction[]; total: number }>
  createTransaction(userId: number, input: NewTransactionInput): Promise<Transaction>
  // Проверяет ownership аккаунта, создаёт транзакцию, обновляет баланс атомарно
  deleteTransaction(userId: number, id: string): Promise<Transaction>
  // Удаляет транзакцию, откатывает баланс аккаунта
}
```

**Ошибки:** сервисы бросают именованные ошибки (`AccountNotFoundError`, `AccessDeniedError`), роуты переводят их в HTTP-статусы.

---

## Стратегия тестирования

### Бэкенд — London School (mock-first)

Все тесты мокируют `@fast-finance/db` через `mock.module`.

| Тест | Сценарии |
|---|---|
| `account.service.test.ts` | getAccounts возвращает список; createAccount сохраняет; updateAccount — 404 если не найден; deleteAccount — тихо |
| `transaction.service.test.ts` | createTransaction: ownership check fails → throws; success → создаёт + обновляет баланс; deleteTransaction: не найден → throws; success → откатывает баланс |
| `routes/auth.test.ts` | dev_bypass → 200; invalid initData → 401; valid → upsert user, возвращает { user } |
| `routes/categories.test.ts` | GET 200 со списком; GET 401 без x-user-id |
| `routes/accounts.test.ts` | PATCH 200 обновляет; PATCH 404 не найден |

### Фронтенд — Vitest + RTL

| Тест | Сценарии |
|---|---|
| `store/auth.test.ts` | initAuth: Telegram WebApp present → вызывает api, сохраняет user; dev mode → dev_bypass; ошибка fetch → error в стор; logout → user: null |
| `store/finance.test.ts` | setActiveTab меняет активный таб; setSelectedAccountId сохраняет id |
| `components/dashboard.test.tsx` | рендерится без ошибок; показывает loading state; показывает данные когда есть user |
| `components/add-transaction.test.tsx` | форма рендерится; smart-input парсит введённый текст; submit вызывает API |

---

## Параллельная стратегия выполнения (RuFlo)

Два агента работают одновременно:

**backend-agent:**
1. Создать `domain/account.service.ts`
2. Создать `domain/transaction.service.ts`
3. Рефакторить `routes/accounts.ts` → делегировать в AccountService
4. Рефакторить `routes/transactions.ts` → делегировать в TransactionService
5. Написать тесты domain-сервисов
6. Дописать тесты роутов (auth, categories, PATCH accounts)
7. Запустить `bun test`

**frontend-agent:**
1. Добавить vitest, @testing-library/react в package.json фронтенда
2. Настроить vitest.config
3. Написать тесты сторов
4. Написать тесты компонентов
5. Запустить `npx vitest run`

---

## Error Handling

Domain-сервисы используют именованные классы ошибок:

```typescript
export class AccessDeniedError extends Error {}
export class NotFoundError extends Error {}
```

Роуты перехватывают и маппят:
```typescript
catch (e) {
  if (e instanceof AccessDeniedError) { set.status = 403; return { error: e.message } }
  if (e instanceof NotFoundError) { set.status = 404; return { error: e.message } }
  throw e
}
```

---

## Файловая структура итого

```
apps/backend/src/
  domain/
    account.service.ts       [NEW]
    transaction.service.ts   [NEW]
  routes/
    accounts.ts              [MODIFY — thin]
    transactions.ts          [MODIFY — thin]
    auth.ts                  [no change]
    categories.ts            [no change]
  __tests__/
    domain/
      account.service.test.ts   [NEW]
      transaction.service.test.ts [NEW]
    routes/
      auth.test.ts           [NEW]
      categories.test.ts     [NEW]
      accounts.test.ts       [MODIFY — add PATCH]
      transactions.test.ts   [no change]
    lib/
      telegram-auth.test.ts  [no change]

apps/frontend/
  __tests__/
    store/
      auth.test.ts           [NEW]
      finance.test.ts        [NEW]
    components/
      dashboard.test.tsx     [NEW]
      add-transaction.test.tsx [NEW]
  vitest.config.ts           [NEW]
  package.json               [MODIFY — add vitest deps]
```
