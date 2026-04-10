import { Elysia } from 'elysia'
import { jwtPlugin } from '../lib/jwt-plugin'

// Paths that do not require a JWT token
const PUBLIC_PATHS = ['/health', '/auth/telegram', '/bot/webhook', '/currency/rates', '/docs']

export function isPublicPath(path: string) {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'))
}

/**
 * Parse userId from a Bearer JWT token WITHOUT cryptographic re-verification.
 * Safe to call only AFTER withAuth() has already validated the token.
 */
export function parseUserIdFromToken(authorization: string | undefined): number {
  if (!authorization?.startsWith('Bearer ')) return 0
  const token = authorization.slice(7)
  const parts = token.split('.')
  if (parts.length !== 3) return 0
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.userId === 'number' ? payload.userId : 0
  } catch {
    return 0
  }
}

/**
 * Auth middleware plugin — validates JWT and rejects requests with 401 if invalid.
 * Route handlers should call parseUserIdFromToken(headers.authorization) to get userId.
 */
export function withAuth() {
  return new Elysia()
    .use(jwtPlugin)
    .onBeforeHandle(async ({ jwt, headers, request, set }) => {
      const path = new URL(request.url).pathname
      if (isPublicPath(path)) return

      const auth = headers.authorization ?? ''
      if (!auth.startsWith('Bearer ')) {
        set.status = 401
        return { error: 'Unauthorized' }
      }

      const payload = await jwt.verify(auth.slice(7))
      if (!payload || typeof payload.userId !== 'number') {
        set.status = 401
        return { error: 'Unauthorized' }
      }
    })
}
