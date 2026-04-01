import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { runMigrations } from '@fast-finance/db'
import { authRouter } from './routes/auth'
import { accountsRouter } from './routes/accounts'
import { transactionsRouter } from './routes/transactions'
import { categoriesRouter } from './routes/categories'
import { botRouter } from './routes/bot'

const app = new Elysia()
  .use(
    cors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
    }),
  )
  .use(swagger({ path: '/docs' }))
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .use(authRouter)
  .use(accountsRouter)
  .use(transactionsRouter)
  .use(categoriesRouter)
  .use(botRouter)

await runMigrations()

app.listen(process.env.PORT || 3001)

console.log(`Backend running at http://localhost:${app.server?.port}`)

export type App = typeof app
