export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export async function validateTelegramInitData(
  initData: string,
  botToken: string,
): Promise<TelegramUser | null> {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return null

    params.delete('hash')

    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}=${val}`)
      .join('\n')

    // HMAC-SHA256: secret = HMAC-SHA256("WebAppData", bot_token)
    const encoder = new TextEncoder()
    const keyData = encoder.encode('WebAppData')
    const tokenData = encoder.encode(botToken)
    const checkData = encoder.encode(dataCheckString)

    const hmacKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )

    const secretRaw = await crypto.subtle.sign('HMAC', hmacKey, tokenData)

    const dataKey = await crypto.subtle.importKey(
      'raw',
      secretRaw,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )

    const signatureRaw = await crypto.subtle.sign('HMAC', dataKey, checkData)
    const computedHash = Array.from(new Uint8Array(signatureRaw))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    if (computedHash !== hash) return null

    const userStr = params.get('user')
    if (!userStr) return null

    return JSON.parse(userStr) as TelegramUser
  } catch {
    return null
  }
}
