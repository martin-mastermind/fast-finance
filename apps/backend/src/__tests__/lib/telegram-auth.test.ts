import { describe, it, expect } from 'bun:test'
import { validateTelegramInitData } from '../../lib/telegram-auth'

// Helper: build a valid initData string signed with a given botToken
async function buildValidInitData(
  botToken: string,
  user: { id: number; username: string; first_name: string },
): Promise<string> {
  const encoder = new TextEncoder()

  const params = new URLSearchParams({
    user: JSON.stringify(user),
    auth_date: String(Math.floor(Date.now() / 1000)),
    query_id: 'test_query',
  })

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const hmacKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const secretRaw = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(botToken))

  const dataKey = await crypto.subtle.importKey(
    'raw',
    secretRaw,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', dataKey, encoder.encode(dataCheckString))
  const hash = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  params.set('hash', hash)
  return params.toString()
}

describe('validateTelegramInitData', () => {
  const BOT_TOKEN = 'test_bot_token_123'
  const TEST_USER = { id: 42, username: 'alice', first_name: 'Alice' }

  it('accepts valid initData and returns user', async () => {
    const initData = await buildValidInitData(BOT_TOKEN, TEST_USER)
    const result = await validateTelegramInitData(initData, BOT_TOKEN)

    expect(result).not.toBeNull()
    expect(result!.id).toBe(42)
    expect(result!.username).toBe('alice')
    expect(result!.first_name).toBe('Alice')
  })

  it('rejects tampered hash', async () => {
    const initData = await buildValidInitData(BOT_TOKEN, TEST_USER)
    const tampered = initData.replace(/hash=[^&]+/, 'hash=deadbeef')
    const result = await validateTelegramInitData(tampered, BOT_TOKEN)
    expect(result).toBeNull()
  })

  it('rejects initData signed with wrong bot token', async () => {
    const initData = await buildValidInitData('wrong_token', TEST_USER)
    const result = await validateTelegramInitData(initData, BOT_TOKEN)
    expect(result).toBeNull()
  })

  it('rejects initData with missing hash', async () => {
    const result = await validateTelegramInitData('user=foo&auth_date=123', BOT_TOKEN)
    expect(result).toBeNull()
  })

  it('rejects empty string', async () => {
    const result = await validateTelegramInitData('', BOT_TOKEN)
    expect(result).toBeNull()
  })

  it('rejects initData without user field', async () => {
    const encoder = new TextEncoder()
    // Build initData without user param
    const params = new URLSearchParams({ auth_date: '1000000' })
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')

    const hmacKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const secretRaw = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(BOT_TOKEN))
    const dataKey = await crypto.subtle.importKey(
      'raw', secretRaw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    )
    const sig = await crypto.subtle.sign('HMAC', dataKey, encoder.encode(dataCheckString))
    const hash = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
    params.set('hash', hash)

    const result = await validateTelegramInitData(params.toString(), BOT_TOKEN)
    expect(result).toBeNull()
  })
})
