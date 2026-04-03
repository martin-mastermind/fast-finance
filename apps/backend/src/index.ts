import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { runMigrations } from '@fast-finance/db'
import { authRouter } from './routes/auth'
import { accountsRouter } from './routes/accounts'
import { transactionsRouter } from './routes/transactions'
import { categoriesRouter } from './routes/categories'
import { botRouter } from './routes/bot'
import { currencyRouter } from './routes/currency'
import { CurrencyService } from './domain/currency.service'

async function startCronJob() {
  const ONE_DAY = 24 * 60 * 60 * 1000
  
  await CurrencyService.updateRates()
  console.log('Currency rates updated')
  
  setInterval(async () => {
    try {
      await CurrencyService.updateRates()
      console.log('Currency rates updated at', new Date().toISOString())
    } catch (error) {
      console.error('Failed to update currency rates:', error)
    }
  }, ONE_DAY)
}

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
  .use(currencyRouter)

await runMigrations()
startCronJob()

app.listen(process.env.PORT || 3001)

console.log(`Backend running at http://localhost:${app.server?.port}`)

export type App = typeof app
