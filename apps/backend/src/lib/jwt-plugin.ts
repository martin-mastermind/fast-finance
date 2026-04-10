import { jwt } from '@elysiajs/jwt'

// Singleton JWT plugin — named so Elysia deduplicates it across all route files
export const jwtPlugin = jwt({
  name: 'jwt',
  secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  exp: '7d',
})
