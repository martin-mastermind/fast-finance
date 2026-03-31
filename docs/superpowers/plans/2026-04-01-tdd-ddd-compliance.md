# TDD/DDD Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Вынести бизнес-логику из роутов в domain-сервисы и закрыть все пробелы тестового покрытия (бэкенд + фронтенд).

**Architecture:** Добавляем `apps/backend/src/domain/` с `AccountService` и `TransactionService`. Роуты делегируют в сервисы. Бэкенд-тесты используют bun:test + mock.module. Тесты компонентов фронтенда — vitest + @testing-library/react + jsdom.

**Tech Stack:** Bun, Elysia, Drizzle ORM, Zustand, Next.js 14, Vitest, @testing-library/react

---

> ⚡ **RuFlo:** Tasks 1–5 = **backend-agent**, Tasks 6–8 = **frontend-agent**. Запускать параллельно.

---

## Task 1: Domain errors + AccountService (TDD)

**Files:**
- Create: `apps/backend/src/domain/account.service.ts`
- Create: `apps/backend/src/__tests__/domain/account.service.test.ts`

- [ ] **Step 1: Написать провальные тесты**

Создать `apps/backend/src/__tests__/domain/account.service.test.ts`:

```typescript
import { describe, it, expect, mock, beforeEach } from 'bun:test'

type MockDb = {
  select: ReturnType<typeof mock>
  insert: ReturnType<typeof mock>
  update: ReturnType<typeof mock>
  delete: ReturnType<typeof mock>
  from: ReturnType<typeof mock>
  where: ReturnType<typeof mock>
  values: ReturnType<typeof mock>
  set: ReturnType<typeof mock>
  returning: ReturnType<typeof mock>
}

const mockDb: MockDb = {
  select: mock(() => mockDb),
  insert: mock(() => mockDb),
  update: mock(() => mockDb),
  delete: mock(() => mockDb),
  from: mock(() => mockDb),
  where: mock(() => Promise.resolve([])),
  values: mock(() => mockDb),
  set: mock(() => mockDb),
  returning: mock(() => Promise.resolve([])),
}

mock.module('@fast-finance/db', () => ({
  db: mockDb,
  accounts: { id: 'id', userId: 'user_id', name: 'name', balance: 'balance' },
}))

mock.module('drizzle-orm', () => ({
  eq: mock(() => 'eq'),
  and: mock(() => 'and'),
}))

const { AccountService, NotFoundError } = await import('../../domain/account.service')

const mockAccount = { id: 1, userId: 1, name: 'Карта', balance: 5000 }

describe('AccountService.getAccounts', () => {
  beforeEach(() => {
    mockDb.select.mockReturnValue(mockDb)
    mockDb.from.mockReturnValue(mockDb)
    mockDb.where.mockResolvedValue([mockAccount])
  })

  it('returns accounts for user', async () => {
    const result = await AccountService.getAccounts(1)
    expect(result).toEqual([mockAccount])
  })
})

describe('AccountService.createAccount', () => {
  beforeEach(() => {
    mockDb.insert.mockReturnValue(mockDb)
    mockDb.values.mockReturnValue(mockDb)
    mockDb.returning.mockResolvedValue([mockAccount])
  })

  it('creates account and returns it', async () => {
    const result = await AccountService.createAccount(1, 'Карта')
    expect(result).toEqual(mockAccount)
  })
})

describe('AccountService.updateAccount', () => {
  beforeEach(() => {
    mockDb.update.mockReturnValue(mockDb)
    mockDb.set.mockReturnValue(mockDb)
  })

  it('returns updated account', async () => {
    mockDb.where.mockReturnValue(mockDb)
    mockDb.returning.mockResolvedValue([{ ...mockAccount, name: 'Новое имя' }])
    const result = await AccountService.updateAccount(1, 1, { name: 'Новое имя' })
    expect(result.name).toBe('Новое имя')
  })

  it('throws NotFoundError when account not found', async () => {
    mockDb.where.mockReturnValue(mockDb)
    mockDb.returning.mockResolvedValue([])
    await expect(AccountService.updateAccount(1, 99, { name: 'x' })).rejects.toThrow(NotFoundError)
  })
})

describe('AccountService.deleteAccount', () => {
  beforeEach(() => {
    mockDb.delete.mockReturnValue(mockDb)
    mockDb.where.mockResolvedValue([])
  })

  it('resolves without error', async () => {
    await expect(AccountService.deleteAccount(1, 1)).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 2: Запустить тест — убедиться что FAIL**

```bash
cd apps/backend && bun test src/__tests__/domain/account.service.test.ts
```

Ожидаем: `Cannot find module '../../domain/account.service'`

- [ ] **Step 3: Реализовать AccountService**

Создать `apps/backend/src/domain/account.service.ts`:

```typescript
import { db, accounts } from '@fast-finance/db'
import { eq, and } from 'drizzle-orm'
import type { Account } from '@fast-finance/db'

export class AccessDeniedError extends Error {
  constructor(message = 'Access denied') { super(message) }
}

export class NotFoundError extends Error {
  constructor(message = 'Not found') { super(message) }
}

export const AccountService = {
  async getAccounts(userId: number): Promise<Account[]> {
    return db.select().from(accounts).where(eq(accounts.userId, userId))
  },

  async createAccount(userId: number, name: string, balance = 0): Promise<Account> {
    const [account] = await db
      .insert(accounts)
      .values({ userId, name, balance })
      .returning()
    return account
  },

  async updateAccount(
    userId: number,
    id: number,
    data: { name?: string; balance?: number },
  ): Promise<Account> {
    const [updated] = await db
      .update(accounts)
      .set(data)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .returning()
    if (!updated) throw new NotFoundError('Account not found')
    return updated
  },

  async deleteAccount(userId: number, id: number): Promise<void> {
    await db
      .delete(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
  },
}
```

- [ ] **Step 4: Запустить тест — убедиться что PASS**

```bash
cd apps/backend && bun test src/__tests__/domain/account.service.test.ts
```

Ожидаем: все 5 тестов зелёные.

- [ ] **Step 5: Коммит**

```bash
cd D:/Code/fast-finance
rtk git add apps/backend/src/domain/account.service.ts apps/backend/src/__tests__/domain/account.service.test.ts
rtk git commit -m "feat: add AccountService domain layer with tests"
```

---

## Task 2: TransactionService (TDD)

**Files:**
- Create: `apps/backend/src/domain/transaction.service.ts`
- Create: `apps/backend/src/__tests__/domain/transaction.service.test.ts`

- [ ] **Step 1: Написать провальные тесты**

Создать `apps/backend/src/__tests__/domain/transaction.service.test.ts`:

```typescript
import { describe, it, expect, mock, beforeEach } from 'bun:test'

type MockDb = {
  select: ReturnType<typeof mock>
  insert: ReturnType<typeof mock>
  update: ReturnType<typeof mock>
  delete: ReturnType<typeof mock>
  from: ReturnType<typeof mock>
  where: ReturnType<typeof mock>
  values: ReturnType<typeof mock>
  set: ReturnType<typeof mock>
  orderBy: ReturnType<typeof mock>
  limit: ReturnType<typeof mock>
  offset: ReturnType<typeof mock>
  returning: ReturnType<typeof mock>
}

const mockDb: MockDb = {
  select: mock(() => mockDb),
  insert: mock(() => mockDb),
  update: mock(() => mockDb),
  delete: mock(() => mockDb),
  from: mock(() => mockDb),
  where: mock(() => mockDb),
  values: mock(() => mockDb),
  set: mock(() => mockDb),
  orderBy: mock(() => mockDb),
  limit: mock(() => mockDb),
  offset: mock(() => Promise.resolve([])),
  returning: mock(() => Promise.resolve([])),
}

mock.module('@fast-finance/db', () => ({
  db: mockDb,
  transactions: { id: 'id', userId: 'user_id', date: 'date', accountId: 'account_id' },
  accounts: { id: 'id', userId: 'user_id', balance: 'balance' },
}))

mock.module('drizzle-orm', () => ({
  eq: mock(() => 'eq'),
  and: mock(() => 'and'),
  desc: mock(() => 'desc'),
  count: mock(() => ({ total: 0 })),
  sql: mock((..._args: unknown[]) => 'sql'),
}))

const { TransactionService } = await import('../../domain/transaction.service')
const { AccessDeniedError, NotFoundError } = await import('../../domain/account.service')

const mockAccount = { id: 1, userId: 1, name: 'Карта', balance: 5000 }
const mockTransaction = {
  id: 'uuid-1',
  userId: 1,
  accountId: 1,
  categoryId: 1,
  amount: -500,
  description: 'кофе',
  date: new Date(),
}

describe('TransactionService.createTransaction', () => {
  beforeEach(() => {
    mockDb.select.mockReset()
    mockDb.from.mockReset()
    mockDb.insert.mockReset()
    mockDb.update.mockReset()
    mockDb.values.mockReset()
    mockDb.set.mockReset()
    mockDb.returning.mockReset()

    mockDb.select.mockReturnValue(mockDb)
    mockDb.from.mockReturnValue(mockDb)
    mockDb.insert.mockReturnValue(mockDb)
    mockDb.update.mockReturnValue(mockDb)
    mockDb.values.mockReturnValue(mockDb)
    mockDb.set.mockReturnValue(mockDb)
  })

  it('throws AccessDeniedError when account not owned by user', async () => {
    mockDb.where.mockResolvedValueOnce([]) // no account

    await expect(
      TransactionService.createTransaction(1, { accountId: 99, categoryId: 1, amount: -500 }),
    ).rejects.toThrow(AccessDeniedError)
  })

  it('creates transaction and updates balance', async () => {
    mockDb.where
      .mockResolvedValueOnce([mockAccount]) // ownership check
      .mockResolvedValueOnce([])            // balance update
    mockDb.returning.mockResolvedValueOnce([mockTransaction])

    const result = await TransactionService.createTransaction(1, {
      accountId: 1,
      categoryId: 1,
      amount: -500,
      description: 'кофе',
    })

    expect(result.amount).toBe(-500)
    expect(result.description).toBe('кофе')
    expect(mockDb.update).toHaveBeenCalled()
  })
})

describe('TransactionService.deleteTransaction', () => {
  beforeEach(() => {
    mockDb.delete.mockReset()
    mockDb.update.mockReset()
    mockDb.set.mockReset()
    mockDb.returning.mockReset()

    mockDb.delete.mockReturnValue(mockDb)
    mockDb.update.mockReturnValue(mockDb)
    mockDb.set.mockReturnValue(mockDb)
  })

  it('throws NotFoundError when transaction not found', async () => {
    mockDb.where.mockReturnValue(mockDb)
    mockDb.returning.mockResolvedValueOnce([])

    await expect(
      TransactionService.deleteTransaction(1, 'non-existent'),
    ).rejects.toThrow(NotFoundError)
  })

  it('deletes transaction and reverses balance', async () => {
    mockDb.where
      .mockReturnValueOnce(mockDb)      // delete chain
      .mockResolvedValueOnce([])        // balance update chain
    mockDb.returning.mockResolvedValueOnce([mockTransaction])

    const result = await TransactionService.deleteTransaction(1, 'uuid-1')

    expect(result.id).toBe('uuid-1')
    expect(mockDb.update).toHaveBeenCalled()
  })
})

describe('TransactionService.getTransactions', () => {
  it('returns paginated result', async () => {
    mockDb.select.mockReturnValue(mockDb)
    mockDb.from.mockReturnValue(mockDb)
    mockDb.where
      .mockResolvedValueOnce([{ total: 1 }])  // count query
      .mockReturnValueOnce(mockDb)            // list chain
    mockDb.orderBy.mockReturnValue(mockDb)
    mockDb.limit.mockReturnValue(mockDb)
    mockDb.offset.mockResolvedValueOnce([mockTransaction])

    const result = await TransactionService.getTransactions(1, 10, 0)

    expect(result.items).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
  })
})
```

- [ ] **Step 2: Запустить тест — убедиться что FAIL**

```bash
cd apps/backend && bun test src/__tests__/domain/transaction.service.test.ts
```

Ожидаем: `Cannot find module '../../domain/transaction.service'`

- [ ] **Step 3: Реализовать TransactionService**

Создать `apps/backend/src/domain/transaction.service.ts`:

```typescript
import { db, transactions, accounts } from '@fast-finance/db'
import { eq, and, desc, count, sql } from 'drizzle-orm'
import type { Transaction } from '@fast-finance/db'
import { AccessDeniedError, NotFoundError } from './account.service'

export interface NewTransactionInput {
  accountId: number
  categoryId: number
  amount: number
  description?: string
  date?: string
}

export const TransactionService = {
  async getTransactions(userId: number, limit: number, offset: number) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(transactions)
      .where(eq(transactions.userId, userId))

    const items = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset)

    return { items, total, page: Math.floor(offset / limit) + 1, pageSize: limit }
  },

  async createTransaction(userId: number, input: NewTransactionInput): Promise<Transaction> {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, userId)))

    if (!account) throw new AccessDeniedError('Account not found or access denied')

    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        accountId: input.accountId,
        categoryId: input.categoryId,
        amount: input.amount,
        description: input.description || null,
        date: input.date ? new Date(input.date) : new Date(),
      })
      .returning()

    await db
      .update(accounts)
      .set({ balance: sql`${accounts.balance} + ${input.amount}` })
      .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, userId)))

    return transaction
  },

  async deleteTransaction(userId: number, id: string): Promise<Transaction> {
    const [deleted] = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning()

    if (!deleted) throw new NotFoundError('Transaction not found')

    await db
      .update(accounts)
      .set({ balance: sql`${accounts.balance} - ${deleted.amount}` })
      .where(eq(accounts.id, deleted.accountId))

    return deleted
  },
}
```

- [ ] **Step 4: Запустить тест — убедиться что PASS**

```bash
cd apps/backend && bun test src/__tests__/domain/transaction.service.test.ts
```

Ожидаем: все 4 теста зелёные.

- [ ] **Step 5: Коммит**

```bash
cd D:/Code/fast-finance
rtk git add apps/backend/src/domain/transaction.service.ts apps/backend/src/__tests__/domain/transaction.service.test.ts
rtk git commit -m "feat: add TransactionService domain layer with tests"
```

---

## Task 3: Рефакторинг accounts route

**Files:**
- Modify: `apps/backend/src/routes/accounts.ts`

- [ ] **Step 1: Запустить существующие тесты — убедиться что PASS (baseline)**

```bash
cd apps/backend && bun test src/__tests__/routes/accounts.test.ts
```

Ожидаем: все тесты зелёные.

- [ ] **Step 2: Заменить содержимое routes/accounts.ts**

```typescript
import { Elysia, t } from 'elysia'
import { AccountService, NotFoundError } from '../domain/account.service'

export const accountsRouter = new Elysia({ prefix: '/accounts' })
  .get('/', async ({ headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    return AccountService.getAccounts(userId)
  })
  .post(
    '/',
    async ({ body, headers, set }) => {
      const userId = parseInt(headers['x-user-id'] || '0')
      if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
      return AccountService.createAccount(userId, body.name, body.balance)
    },
    { body: t.Object({ name: t.String(), balance: t.Optional(t.Number()) }) },
  )
  .patch(
    '/:id',
    async ({ params, body, headers, set }) => {
      const userId = parseInt(headers['x-user-id'] || '0')
      if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        return await AccountService.updateAccount(userId, parseInt(params.id), body)
      } catch (e) {
        if (e instanceof NotFoundError) { set.status = 404; return { error: e.message } }
        throw e
      }
    },
    { body: t.Object({ name: t.Optional(t.String()), balance: t.Optional(t.Number()) }) },
  )
  .delete('/:id', async ({ params, headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    await AccountService.deleteAccount(userId, parseInt(params.id))
    return { success: true }
  })
```

- [ ] **Step 3: Полностью заменить содержимое accounts.test.ts**

После рефакторинга роут не обращается к БД напрямую — мокируем AccountService, а не db:

```typescript
import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { Elysia } from 'elysia'

const mockGetAccounts = mock(async () => [] as any[])
const mockCreateAccount = mock(async () => ({ id: 3, userId: 1, name: 'Вклад', balance: 0 }))
const mockUpdateAccount = mock(async () => ({ id: 1, userId: 1, name: 'Обновлено', balance: 0 }))
const mockDeleteAccount = mock(async () => undefined)

mock.module('../../domain/account.service', () => ({
  AccountService: {
    getAccounts: mockGetAccounts,
    createAccount: mockCreateAccount,
    updateAccount: mockUpdateAccount,
    deleteAccount: mockDeleteAccount,
  },
  NotFoundError: class NotFoundError extends Error {},
}))

const { accountsRouter } = await import('../../routes/accounts')
const app = new Elysia().use(accountsRouter)

function makeRequest(method: string, path: string, opts: { userId?: number; body?: unknown } = {}) {
  const { userId = 1, body } = opts
  return app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-user-id': String(userId),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  )
}

describe('GET /accounts', () => {
  beforeEach(() => {
    mockGetAccounts.mockResolvedValue([
      { id: 1, userId: 1, name: 'Карта', balance: 5000 },
      { id: 2, userId: 1, name: 'Наличные', balance: 1000 },
    ])
  })

  it('returns accounts for authenticated user', async () => {
    const res = await makeRequest('GET', '/accounts')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)
    expect(data[0].name).toBe('Карта')
  })

  it('returns 401 without x-user-id header', async () => {
    const res = await app.handle(new Request('http://localhost/accounts', { method: 'GET' }))
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })
})

describe('POST /accounts', () => {
  beforeEach(() => {
    mockCreateAccount.mockResolvedValue({ id: 3, userId: 1, name: 'Вклад', balance: 0 })
  })

  it('creates account and returns it', async () => {
    const res = await makeRequest('POST', '/accounts', { body: { name: 'Вклад' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('Вклад')
    expect(data.id).toBe(3)
  })

  it('returns 401 without user id', async () => {
    const res = await app.handle(
      new Request('http://localhost/accounts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      }),
    )
    expect(res.status).toBe(401)
  })
})

describe('PATCH /accounts/:id', () => {
  beforeEach(() => {
    mockUpdateAccount.mockResolvedValue({ id: 1, userId: 1, name: 'Обновлено', balance: 9999 })
  })

  it('updates account and returns it', async () => {
    const res = await makeRequest('PATCH', '/accounts/1', { body: { name: 'Обновлено' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('Обновлено')
  })

  it('returns 404 when account not found', async () => {
    const { NotFoundError } = await import('../../domain/account.service')
    mockUpdateAccount.mockRejectedValue(new NotFoundError('Account not found'))
    const res = await makeRequest('PATCH', '/accounts/999', { body: { name: 'x' } })
    expect(res.status).toBe(404)
  })

  it('returns 401 without user id', async () => {
    const res = await app.handle(
      new Request('http://localhost/accounts/1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'x' }),
      }),
    )
    expect(res.status).toBe(401)
  })
})

describe('DELETE /accounts/:id', () => {
  beforeEach(() => {
    mockDeleteAccount.mockResolvedValue(undefined)
  })

  it('deletes account and returns success', async () => {
    const res = await makeRequest('DELETE', '/accounts/1')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })
})
```

- [ ] **Step 4: Запустить тесты — убедиться что PASS**

```bash
cd apps/backend && bun test src/__tests__/routes/accounts.test.ts
```

Ожидаем: все тесты (включая новые PATCH) зелёные.

- [ ] **Step 5: Коммит**

```bash
cd D:/Code/fast-finance
rtk git add apps/backend/src/routes/accounts.ts apps/backend/src/__tests__/routes/accounts.test.ts
rtk git commit -m "refactor: accounts route delegates to AccountService; add PATCH tests"
```

---

## Task 4: Рефакторинг transactions route

**Files:**
- Modify: `apps/backend/src/routes/transactions.ts`
- Modify: `apps/backend/src/__tests__/routes/transactions.test.ts`

- [ ] **Step 1: Запустить существующие тесты — убедиться что PASS (baseline)**

```bash
cd apps/backend && bun test src/__tests__/routes/transactions.test.ts
```

Ожидаем: все тесты зелёные.

- [ ] **Step 2: Заменить содержимое routes/transactions.ts**

```typescript
import { Elysia, t } from 'elysia'
import { TransactionService } from '../domain/transaction.service'
import { AccessDeniedError, NotFoundError } from '../domain/account.service'

export const transactionsRouter = new Elysia({ prefix: '/transactions' })
  .get('/', async ({ headers, query, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    const limit = parseInt(String(query.limit ?? '50'))
    const offset = parseInt(String(query.offset ?? '0'))
    return TransactionService.getTransactions(userId, limit, offset)
  })
  .post(
    '/',
    async ({ body, headers, set }) => {
      const userId = parseInt(headers['x-user-id'] || '0')
      if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        return await TransactionService.createTransaction(userId, body)
      } catch (e) {
        if (e instanceof AccessDeniedError) { set.status = 403; return { error: e.message } }
        throw e
      }
    },
    {
      body: t.Object({
        accountId: t.Number(),
        categoryId: t.Number(),
        amount: t.Number(),
        description: t.Optional(t.String()),
        date: t.Optional(t.String()),
      }),
    },
  )
  .delete('/:id', async ({ params, headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    try {
      await TransactionService.deleteTransaction(userId, params.id)
      return { success: true }
    } catch (e) {
      if (e instanceof NotFoundError) { set.status = 404; return { error: e.message } }
      throw e
    }
  })
```

- [ ] **Step 3: Обновить transactions.test.ts — мокировать TransactionService**

Заменить всё содержимое `apps/backend/src/__tests__/routes/transactions.test.ts`:

```typescript
import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { Elysia } from 'elysia'

const mockGetTransactions = mock(async () => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
}))
const mockCreateTransaction = mock(async () => ({}))
const mockDeleteTransaction = mock(async () => ({}))

mock.module('../../domain/transaction.service', () => ({
  TransactionService: {
    getTransactions: mockGetTransactions,
    createTransaction: mockCreateTransaction,
    deleteTransaction: mockDeleteTransaction,
  },
}))

mock.module('../../domain/account.service', () => ({
  AccessDeniedError: class AccessDeniedError extends Error {},
  NotFoundError: class NotFoundError extends Error {},
}))

const { transactionsRouter } = await import('../../routes/transactions')
const app = new Elysia().use(transactionsRouter)

const mockTransaction = {
  id: 'uuid-123',
  userId: 1,
  accountId: 1,
  categoryId: 1,
  amount: -500,
  description: 'кофе',
  date: new Date(),
}

function makeRequest(
  method: string,
  path: string,
  opts: { userId?: number; body?: unknown } = {},
) {
  const { userId = 1, body } = opts
  return app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-user-id': String(userId),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  )
}

describe('GET /transactions', () => {
  beforeEach(() => {
    mockGetTransactions.mockResolvedValue({
      items: [mockTransaction],
      total: 1,
      page: 1,
      pageSize: 10,
    })
  })

  it('returns paginated transactions', async () => {
    const res = await makeRequest('GET', '/transactions?limit=10&offset=0')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('items')
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('page')
    expect(data).toHaveProperty('pageSize')
  })

  it('returns 401 without user id', async () => {
    const res = await app.handle(new Request('http://localhost/transactions'))
    expect(res.status).toBe(401)
  })
})

describe('POST /transactions', () => {
  beforeEach(() => {
    mockCreateTransaction.mockResolvedValue(mockTransaction)
  })

  it('returns 403 when account does not belong to user', async () => {
    const { AccessDeniedError } = await import('../../domain/account.service')
    mockCreateTransaction.mockRejectedValue(new AccessDeniedError('Access denied'))

    const res = await makeRequest('POST', '/transactions', {
      body: { accountId: 99, categoryId: 1, amount: -500, description: 'кофе' },
    })
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toContain('denied')
  })

  it('creates transaction when account belongs to user', async () => {
    const res = await makeRequest('POST', '/transactions', {
      body: { accountId: 1, categoryId: 1, amount: -500, description: 'кофе' },
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.amount).toBe(-500)
    expect(data.description).toBe('кофе')
  })
})

describe('DELETE /transactions/:id', () => {
  beforeEach(() => {
    mockDeleteTransaction.mockResolvedValue(mockTransaction)
  })

  it('returns 404 for non-existent transaction', async () => {
    const { NotFoundError } = await import('../../domain/account.service')
    mockDeleteTransaction.mockRejectedValue(new NotFoundError('Transaction not found'))

    const res = await makeRequest('DELETE', '/transactions/non-existent-uuid')
    expect(res.status).toBe(404)
  })

  it('deletes transaction successfully', async () => {
    const res = await makeRequest('DELETE', '/transactions/uuid-123')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })
})
```

- [ ] **Step 4: Запустить тесты — убедиться что PASS**

```bash
cd apps/backend && bun test src/__tests__/routes/transactions.test.ts
```

Ожидаем: все тесты зелёные.

- [ ] **Step 5: Коммит**

```bash
cd D:/Code/fast-finance
rtk git add apps/backend/src/routes/transactions.ts apps/backend/src/__tests__/routes/transactions.test.ts
rtk git commit -m "refactor: transactions route delegates to TransactionService; simplify tests"
```

---

## Task 5: Недостающие тесты роутов (auth + categories)

**Files:**
- Create: `apps/backend/src/__tests__/routes/auth.test.ts`
- Create: `apps/backend/src/__tests__/routes/categories.test.ts`

- [ ] **Step 1: Создать auth.test.ts**

```typescript
import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { Elysia } from 'elysia'

const mockValidate = mock(async (_data: string, _token: string) => null as any)

mock.module('../../lib/telegram-auth', () => ({
  validateTelegramInitData: mockValidate,
}))

const mockReturning = mock(() => Promise.resolve([{
  id: 1,
  telegramId: '42',
  username: 'alice',
  currency: 'RUB',
}]))
const mockOnConflict = mock(() => ({ returning: mockReturning }))
const mockValues = mock(() => ({ onConflictDoUpdate: mockOnConflict }))
const mockInsert = mock(() => ({ values: mockValues }))

mock.module('@fast-finance/db', () => ({
  db: { insert: mockInsert },
  users: { telegramId: 'telegram_id' },
}))

process.env.TELEGRAM_BOT_TOKEN = 'test_token'

const { authRouter } = await import('../../routes/auth')
const app = new Elysia().use(authRouter)

function postAuth(initData: string) {
  return app.handle(
    new Request('http://localhost/auth/telegram', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initData }),
    }),
  )
}

describe('POST /auth/telegram', () => {
  beforeEach(() => {
    mockValidate.mockReset()
    mockInsert.mockReturnValue({ values: mockValues })
    mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflict })
    mockOnConflict.mockReturnValue({ returning: mockReturning })
    mockReturning.mockResolvedValue([{ id: 1, telegramId: '42', username: 'alice', currency: 'RUB' }])
    process.env.NODE_ENV = 'test'
  })

  it('returns 401 when initData is invalid', async () => {
    mockValidate.mockResolvedValue(null)
    const res = await postAuth('invalid_data')
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toContain('Invalid')
  })

  it('returns user when valid initData', async () => {
    mockValidate.mockResolvedValue({ id: 42, username: 'alice', first_name: 'Alice' })
    const res = await postAuth('valid_init_data')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.user).toBeDefined()
    expect(data.user.id).toBe(1)
  })

  it('uses dev_bypass in development mode', async () => {
    process.env.NODE_ENV = 'development'
    const res = await postAuth('dev_bypass')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.user).toBeDefined()
    process.env.NODE_ENV = 'test'
  })

  it('returns 500 when TELEGRAM_BOT_TOKEN not set', async () => {
    const saved = process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_BOT_TOKEN
    const res = await postAuth('some_data')
    process.env.TELEGRAM_BOT_TOKEN = saved
    expect(res.status).toBe(500)
  })
})
```

- [ ] **Step 2: Создать categories.test.ts**

```typescript
import { describe, it, expect, mock } from 'bun:test'
import { Elysia } from 'elysia'

const mockCategories = [
  { id: 1, name: 'Еда', icon: '🍕', type: 'expense' },
  { id: 2, name: 'Зарплата', icon: '💰', type: 'income' },
]

const mockDb = {
  select: mock(() => mockDb),
  from: mock(() => Promise.resolve(mockCategories)),
}

mock.module('@fast-finance/db', () => ({
  db: mockDb,
  categories: {},
}))

const { categoriesRouter } = await import('../../routes/categories')
const app = new Elysia().use(categoriesRouter)

describe('GET /categories', () => {
  it('returns all categories for authenticated user', async () => {
    const res = await app.handle(
      new Request('http://localhost/categories', {
        headers: { 'x-user-id': '1' },
      }),
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)
    expect(data[0].name).toBe('Еда')
  })

  it('returns 401 without x-user-id header', async () => {
    const res = await app.handle(new Request('http://localhost/categories'))
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })
})
```

- [ ] **Step 3: Запустить все бэкенд-тесты**

```bash
cd apps/backend && bun test src/__tests__
```

Ожидаем: все тесты зелёные (routes/auth, routes/categories, routes/accounts, routes/transactions, domain/*, lib/*).

- [ ] **Step 4: Коммит**

```bash
cd D:/Code/fast-finance
rtk git add apps/backend/src/__tests__/routes/auth.test.ts apps/backend/src/__tests__/routes/categories.test.ts
rtk git commit -m "test: add missing route tests for auth and categories"
```

---

## Task 6: Настройка Vitest для компонентов фронтенда

**Files:**
- Modify: `apps/frontend/package.json`
- Create: `apps/frontend/vitest.config.ts`
- Create: `apps/frontend/vitest.setup.ts`

- [ ] **Step 1: Добавить зависимости в package.json фронтенда**

В `apps/frontend/package.json` добавить в `devDependencies`:

```json
"vitest": "^1.6.0",
"@vitejs/plugin-react": "^4.3.0",
"@testing-library/react": "^16.0.0",
"@testing-library/jest-dom": "^6.4.0",
"@testing-library/user-event": "^14.5.0",
"jsdom": "^24.0.0"
```

И добавить скрипт в `scripts`:

```json
"test:components": "vitest run --config vitest.config.ts"
```

- [ ] **Step 2: Установить зависимости**

```bash
cd apps/frontend && bun install
```

Ожидаем: пакеты установлены без ошибок.

- [ ] **Step 3: Создать vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['__tests__/components/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 4: Создать vitest.setup.ts**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Коммит**

```bash
cd D:/Code/fast-finance
rtk git add apps/frontend/package.json apps/frontend/vitest.config.ts apps/frontend/vitest.setup.ts bun.lock
rtk git commit -m "chore: add vitest + @testing-library/react for component tests"
```

---

## Task 7: Тесты Zustand-сторов

**Files:**
- Create: `apps/frontend/__tests__/store/auth.test.ts`
- Create: `apps/frontend/__tests__/store/finance.test.ts`

- [ ] **Step 1: Создать тест finance store**

Создать `apps/frontend/__tests__/store/finance.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'bun:test'
import { useFinanceStore } from '../../store/finance'

describe('useFinanceStore', () => {
  beforeEach(() => {
    useFinanceStore.setState({ activeTab: 'dashboard', selectedAccountId: null })
  })

  it('initial activeTab is dashboard', () => {
    expect(useFinanceStore.getState().activeTab).toBe('dashboard')
  })

  it('setActiveTab switches to add', () => {
    useFinanceStore.getState().setActiveTab('add')
    expect(useFinanceStore.getState().activeTab).toBe('add')
  })

  it('setActiveTab switches to history', () => {
    useFinanceStore.getState().setActiveTab('history')
    expect(useFinanceStore.getState().activeTab).toBe('history')
  })

  it('selectedAccountId is null initially', () => {
    expect(useFinanceStore.getState().selectedAccountId).toBeNull()
  })

  it('setSelectedAccountId stores account id', () => {
    useFinanceStore.getState().setSelectedAccountId(5)
    expect(useFinanceStore.getState().selectedAccountId).toBe(5)
  })

  it('setSelectedAccountId accepts null', () => {
    useFinanceStore.getState().setSelectedAccountId(5)
    useFinanceStore.getState().setSelectedAccountId(null)
    expect(useFinanceStore.getState().selectedAccountId).toBeNull()
  })
})
```

- [ ] **Step 2: Запустить finance store тест — убедиться что PASS**

```bash
cd apps/frontend && bun test __tests__/store/finance.test.ts
```

Ожидаем: все 6 тестов зелёные.

- [ ] **Step 3: Создать тест auth store**

Создать `apps/frontend/__tests__/store/auth.test.ts`:

```typescript
import { describe, it, expect, mock, beforeEach } from 'bun:test'

const mockTelegramAuth = mock(async (_initData: string) => ({
  user: { id: 1, telegramId: '123456789', username: 'alice', currency: 'RUB' },
}))

mock.module('@/lib/api', () => ({
  createApiClient: mock(() => ({
    auth: { telegram: mockTelegramAuth },
  })),
}))

// Симулируем окружение без Telegram WebApp
;(global as any).window = {}
process.env.NODE_ENV = 'development'

const { useAuthStore } = await import('../../store/auth')

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: false, error: null })
    mockTelegramAuth.mockResolvedValue({
      user: { id: 1, telegramId: '123456789', username: 'alice', currency: 'RUB' },
    })
  })

  it('initial state: user null, not loading, no error', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('initAuth sets user on success', async () => {
    await useAuthStore.getState().initAuth()
    const state = useAuthStore.getState()
    expect(state.user).not.toBeNull()
    expect(state.user!.id).toBe(1)
    expect(state.user!.username).toBe('alice')
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('initAuth sets error on API failure', async () => {
    mockTelegramAuth.mockRejectedValue(new Error('Network error'))
    await useAuthStore.getState().initAuth()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.error).toContain('Network error')
    expect(state.isLoading).toBe(false)
  })

  it('logout clears user', async () => {
    await useAuthStore.getState().initAuth()
    expect(useAuthStore.getState().user).not.toBeNull()
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().user).toBeNull()
  })
})
```

- [ ] **Step 4: Запустить auth store тест — убедиться что PASS**

```bash
cd apps/frontend && bun test __tests__/store/auth.test.ts
```

Ожидаем: все 4 теста зелёные.

- [ ] **Step 5: Запустить все фронтенд bun-тесты**

```bash
cd apps/frontend && bun test __tests__
```

Ожидаем: store/*, lib/* — все зелёные.

- [ ] **Step 6: Коммит**

```bash
cd D:/Code/fast-finance
rtk git add apps/frontend/__tests__/store/auth.test.ts apps/frontend/__tests__/store/finance.test.ts
rtk git commit -m "test: add Zustand store tests for auth and finance"
```

---

## Task 8: Тесты компонентов (Vitest + RTL)

**Files:**
- Create: `apps/frontend/__tests__/components/dashboard.test.tsx`
- Create: `apps/frontend/__tests__/components/add-transaction.test.tsx`

- [ ] **Step 1: Создать dashboard.test.tsx**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}))

vi.mock('@/components/balance-card', () => ({
  BalanceCard: () => React.createElement('div', { 'data-testid': 'balance-card' }),
}))

vi.mock('@/components/transaction-list', () => ({
  TransactionList: () => React.createElement('div', { 'data-testid': 'transaction-list' }),
}))

vi.mock('@/components/add-transaction', () => ({
  AddTransaction: () => React.createElement('div', { 'data-testid': 'add-transaction' }),
}))

vi.mock('@/components/bottom-nav', () => ({
  BottomNav: () => React.createElement('div', { 'data-testid': 'bottom-nav' }),
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/store/finance', () => ({
  useFinanceStore: vi.fn(),
}))

import { Dashboard } from '../../components/dashboard'
import { useAuthStore } from '@/store/auth'
import { useFinanceStore } from '@/store/finance'

const mockUser = { id: 1, telegramId: '42', username: 'alice', currency: 'RUB' }

describe('Dashboard', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({ user: mockUser } as any)
    vi.mocked(useFinanceStore).mockReturnValue({ activeTab: 'dashboard' } as any)
  })

  it('рендерит dashboard вкладку', () => {
    render(<Dashboard />)
    expect(screen.getByText('Мои финансы')).toBeInTheDocument()
    expect(screen.getByText(/Привет, alice/)).toBeInTheDocument()
    expect(screen.getByTestId('balance-card')).toBeInTheDocument()
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
  })

  it('рендерит вкладку добавления транзакции', () => {
    vi.mocked(useFinanceStore).mockReturnValue({ activeTab: 'add' } as any)
    render(<Dashboard />)
    expect(screen.getByText('Новая операция')).toBeInTheDocument()
    expect(screen.getByTestId('add-transaction')).toBeInTheDocument()
  })

  it('рендерит вкладку истории', () => {
    vi.mocked(useFinanceStore).mockReturnValue({ activeTab: 'history' } as any)
    render(<Dashboard />)
    expect(screen.getByText('История')).toBeInTheDocument()
  })

  it('показывает имя пользователя из стора', () => {
    render(<Dashboard />)
    expect(screen.getByText(/alice/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Запустить dashboard тест — убедиться что PASS**

```bash
cd apps/frontend && bun run test:components -- --reporter=verbose
```

Ожидаем: 4 теста зелёных для dashboard.

- [ ] **Step 3: Создать add-transaction.test.tsx**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}))

vi.mock('@/lib/api', () => ({
  createApiClient: vi.fn(() => ({
    accounts: { list: vi.fn() },
    categories: { list: vi.fn() },
    transactions: { create: vi.fn() },
  })),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', props, children),
  },
}))

import { AddTransaction } from '../../components/add-transaction'
import { useQuery, useMutation } from '@tanstack/react-query'

const mockAccounts = [{ id: 1, name: 'Карта', balance: 5000 }]
const mockCategories = [
  { id: 1, name: 'Еда', icon: '🍕', type: 'expense' },
  { id: 2, name: 'Зарплата', icon: '💰', type: 'income' },
]

describe('AddTransaction', () => {
  beforeEach(() => {
    vi.mocked(useQuery).mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'accounts') return { data: mockAccounts } as any
      if (queryKey[0] === 'categories') return { data: mockCategories } as any
      return { data: undefined } as any
    })
    vi.mocked(useMutation).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
  })

  it('рендерит поле умного ввода', () => {
    render(<AddTransaction userId={1} />)
    expect(screen.getByPlaceholderText('500 кофе или зарплата 50000')).toBeInTheDocument()
  })

  it('парсит расход при нажатии Enter', () => {
    render(<AddTransaction userId={1} />)
    const input = screen.getByPlaceholderText('500 кофе или зарплата 50000')
    fireEvent.change(input, { target: { value: '500 кофе' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('-500.00')).toBeInTheDocument()
  })

  it('парсит доход при нажатии Enter', () => {
    render(<AddTransaction userId={1} />)
    const input = screen.getByPlaceholderText('500 кофе или зарплата 50000')
    fireEvent.change(input, { target: { value: 'зарплата 50000' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('+50000.00')).toBeInTheDocument()
  })

  it('парсит ввод при клике на кнопку', () => {
    render(<AddTransaction userId={1} />)
    const input = screen.getByPlaceholderText('500 кофе или зарплата 50000')
    fireEvent.change(input, { target: { value: '300 такси' } })
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByText('-300.00')).toBeInTheDocument()
  })

  it('показывает подсказку когда нет счетов', () => {
    vi.mocked(useQuery).mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'accounts') return { data: [] } as any
      if (queryKey[0] === 'categories') return { data: mockCategories } as any
      return { data: undefined } as any
    })
    render(<AddTransaction userId={1} />)
    expect(screen.getByText('Сначала создайте счёт в настройках')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Запустить все компонентные тесты — убедиться что PASS**

```bash
cd apps/frontend && bun run test:components
```

Ожидаем: 4 dashboard + 5 add-transaction = 9 тестов зелёных.

- [ ] **Step 5: Финальный прогон всех тестов проекта**

```bash
cd D:/Code/fast-finance
cd apps/backend && bun test src/__tests__ && cd ../frontend && bun test __tests__ && bun run test:components
```

Ожидаем: все тесты зелёные.

- [ ] **Step 6: Финальный коммит**

```bash
cd D:/Code/fast-finance
rtk git add apps/frontend/__tests__/components/dashboard.test.tsx apps/frontend/__tests__/components/add-transaction.test.tsx
rtk git commit -m "test: add component tests for Dashboard and AddTransaction"
```
