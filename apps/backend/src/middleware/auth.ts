import { Elysia } from 'elysia'
import { eq } from 'drizzle-orm'
import { jwtPlugin } from '../lib/jwt-plugin'
import { db, users } from '@fast-finance/db'

// CSRF PROTECTION NOTE:
// This application uses JWT tokens passed via the Authorization header (Bearer scheme).
// Since authentication is NOT cookie-based, there is no CSRF attack vector — cross-site
// requests cannot set the Authorization header from a third-party origin.
// Therefore no CSRF token implementation is required.
// Reference: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html

// Paths that do not require a JWT access token
const PUBLIC_PATHS = [
  '/health',
  '/auth/telegram',
  '/auth/refresh',
  '/auth/logout',
  '/bot/webhook',
  '/currency/rates',
  '/docs',
]

export function isPublicPath(path: string) {
  // Strip API version prefix (e.g. /v1) before checking public paths
  const normalizedPath = path.replace(/^\/v\d+/, '')
  return PUBLIC_PATHS.some((p) => normalizedPath === p || normalizedPath.startsWith(p + '/'))
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

/**
 * RBAC middleware — requires a specific role in addition to valid JWT.
 * Adds one DB query per request; use only for admin routes.
 */
export function withRole(requiredRole: 'admin' | 'user') {
  return new Elysia()
    .use(withAuth())
    .onBeforeHandle(async ({ headers, set }) => {
      const userId = parseUserIdFromToken(headers.authorization)
      if (!userId) {
        set.status = 401
        return { error: 'Unauthorized' }
      }
      const [user] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
      if (!user || user.role !== requiredRole) {
        set.status = 403
        return { error: 'Forbidden' }
      }
    })
}
