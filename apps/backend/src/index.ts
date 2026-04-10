import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { rateLimit } from 'elysia-rate-limit'
import { runMigrations } from '@fast-finance/db'
import { authRouter } from './routes/auth'
import { usersRouter } from './routes/users'
import { accountsRouter } from './presentation/routes/accounts'
import { transactionsRouter } from './presentation/routes/transactions'
import { categoriesRouter } from './routes/categories'
import { botRouter } from './routes/bot'
import { aiRouter } from './routes/ai'
import { currencyRouter } from './routes/currency'
import { billingRouter } from './routes/billing'
import { orgsRouter } from './routes/orgs'
import { CurrencyService } from './domain/currency.service'
import { client } from './infrastructure/database/connection'
import { logger } from './lib/logger'

// Validate required environment variables — fail fast before binding any port
const requiredEnvVars = ['DATABASE_URL', 'TELEGRAM_BOT_TOKEN', 'JWT_SECRET']
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error({ envVar }, `Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

if (!process.env.FRONTEND_URL && process.env.NODE_ENV === 'production') {
  logger.warn('FRONTEND_URL is not set; CORS will be restrictive in production')
}

async function startCronJob() {
  const ONE_DAY = 24 * 60 * 60 * 1000
  try {
    await CurrencyService.updateRates()
    logger.info('Currency rates updated on startup')
  } catch (err) {
    logger.error({ err }, 'Failed to update currency rates on startup')
  }
  setInterval(async () => {
    try {
      await CurrencyService.updateRates()
      logger.info('Currency rates updated (scheduled)')
    } catch (err) {
      logger.error({ err }, 'Failed to update currency rates (scheduled)')
    }
  }, ONE_DAY)
}

// All versioned API routes under /v1
// NOTE: botRouter stays unversioned — Telegram webhook URL is registered externally
//       and cannot be changed without re-registering with the Telegram API.
const v1 = new Elysia({ prefix: '/v1' })
  .use(authRouter)
  .use(usersRouter)
  .use(accountsRouter)
  .use(transactionsRouter)
  .use(categoriesRouter)
  .use(aiRouter)
  .use(currencyRouter)
  .use(billingRouter)
  .use(orgsRouter)

const app = new Elysia()
  // ── Rate limiting ──────────────────────────────────────────────────────────
  .use(rateLimit({ max: 100, duration: 60_000 }))

  // ── CORS ───────────────────────────────────────────────────────────────────
  .use(
    cors({
      origin: process.env.FRONTEND_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : false),
      credentials: true,
    }),
  )

  // ── Swagger docs ───────────────────────────────────────────────────────────
  .use(swagger({ path: '/docs' }))

  // ── Security headers ───────────────────────────────────────────────────────
  .onAfterHandle(({ set }) => {
    set.headers['X-Content-Type-Options'] = 'nosniff'
    set.headers['X-Frame-Options'] = 'DENY'
    set.headers['X-XSS-Protection'] = '1; mode=block'
    set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    if (process.env.NODE_ENV === 'production') {
      set.headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload'
    }
  })

  // ── Request logging ────────────────────────────────────────────────────────
  .onRequest(({ request }) => {
    logger.info({ method: request.method, url: request.url }, 'incoming request')
  })
  .onAfterHandle(({ request, set }) => {
    logger.info({ method: request.method, url: request.url, status: set.status }, 'request completed')
  })

  // ── Global error handler ───────────────────────────────────────────────────
  .onError(({ code, error, set, request }) => {
    logger.error({ code, message: (error as Error).message, url: request.url }, 'unhandled error')
    if (code === 'VALIDATION') {
      set.status = 400
      return { error: 'Invalid request data', details: (error as Error).message }
    }
    if (code === 'NOT_FOUND') {
      set.status = 404
      return { error: 'Route not found' }
    }
    set.status = 500
    return { error: 'Internal server error' }
  })

  // ── Health check (unversioned) ─────────────────────────────────────────────
  .get('/health', async () => {
    let dbStatus = 'ok'
    try {
      await client`SELECT 1`
    } catch {
      dbStatus = 'error'
    }
    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: { database: dbStatus },
    }
  })

  // ── Versioned API routes ───────────────────────────────────────────────────
  .use(v1)

  // ── Bot webhook (unversioned — Telegram URL is externally registered) ──────
  .use(botRouter)

await runMigrations()
await startCronJob()

app.listen(process.env.PORT || 3001)

logger.info({ port: app.server?.port }, 'Backend started')

export type App = typeof app
