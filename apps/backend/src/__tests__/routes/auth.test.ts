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
    process.env.TELEGRAM_BOT_TOKEN = 'test_token'
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
