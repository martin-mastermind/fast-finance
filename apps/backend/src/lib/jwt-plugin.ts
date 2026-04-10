import { jwt } from '@elysiajs/jwt'

// Access token — short-lived for security (1 hour)
// NOTE: This was changed from 7d to 1h. Existing 7d tokens will be rejected.
// Users must re-authenticate or use /auth/refresh with a valid refresh token.
export const jwtPlugin = jwt({
  name: 'jwt',
  secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  exp: '1h',
})

// Refresh token — long-lived, stored in DB for revocation support (30 days)
// Uses REFRESH_TOKEN_SECRET if set, otherwise falls back to JWT_SECRET
export const refreshJwtPlugin = jwt({
  name: 'refreshJwt',
  secret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || 'dev-secret-change-in-production',
  exp: '30d',
})
