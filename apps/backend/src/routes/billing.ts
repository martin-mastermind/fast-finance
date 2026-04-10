import { Elysia } from 'elysia'
import { db, subscriptionPlans, userSubscriptions } from '@fast-finance/db'
import { eq } from 'drizzle-orm'
import { withAuth, parseUserIdFromToken } from '../middleware/auth'
import { logger } from '../lib/logger'

// 1 Star ≈ $0.013  →  250 Stars ≈ $3.25/month
export const STARS_PRO_PRICE = 250

async function createStarsInvoiceLink(userId: number): Promise<string> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN!
  const payload = JSON.stringify({ userId })

  const res = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Fast Finance Pro',
      description: 'Unlimited accounts, transactions & AI assistant for 30 days',
      payload,
      currency: 'XTR',           // Telegram Stars
      provider_token: '',         // must be empty for Stars
      prices: [{ label: 'Pro Plan (30 days)', amount: STARS_PRO_PRICE }],
    }),
  })

  const data = await res.json() as { ok: boolean; result?: string; description?: string }
  if (!data.ok) throw new Error(data.description ?? 'Failed to create invoice')
  return data.result!
}

export const billingRouter = new Elysia({ prefix: '/billing' })
  .get('/plans', async () => {
    return db.select().from(subscriptionPlans)
  })
  .use(withAuth())
  .get('/subscription', async ({ headers }) => {
    const userId = parseUserIdFromToken(headers.authorization)

    const [sub] = await db
      .select({
        id: userSubscriptions.id,
        status: userSubscriptions.status,
        currentPeriodEnd: userSubscriptions.currentPeriodEnd,
        plan: {
          id: subscriptionPlans.id,
          name: subscriptionPlans.name,
          maxAccounts: subscriptionPlans.maxAccounts,
          maxTransactionsPerMonth: subscriptionPlans.maxTransactionsPerMonth,
          aiChatEnabled: subscriptionPlans.aiChatEnabled,
          price: subscriptionPlans.price,
        },
      })
      .from(userSubscriptions)
      .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(userSubscriptions.userId, userId))
      .limit(1)

    if (!sub) {
      const [freePlan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, 'free'))
        .limit(1)
      return { plan: freePlan ?? null, status: 'active', currentPeriodEnd: null }
    }

    return sub
  })
  .post('/stars/invoice', async ({ headers, set }) => {
    const userId = parseUserIdFromToken(headers.authorization)
    try {
      const invoiceLink = await createStarsInvoiceLink(userId)
      return { invoiceLink, stars: STARS_PRO_PRICE }
    } catch (err) {
      logger.error({ err, userId }, 'Failed to create Stars invoice')
      set.status = 500
      return { error: 'Failed to create invoice' }
    }
  })
