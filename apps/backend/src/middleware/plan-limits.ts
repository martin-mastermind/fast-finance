import { Elysia } from 'elysia'
import { eq, and, isNull, gte, count } from 'drizzle-orm'
import { db, accounts, transactions, subscriptionPlans, userSubscriptions } from '@fast-finance/db'
import { parseUserIdFromToken } from './auth'

type PlanResource = 'accounts' | 'transactions' | 'ai_chat'

export async function getUserPlan(userId: number) {
  const [sub] = await db
    .select({
      maxAccounts: subscriptionPlans.maxAccounts,
      maxTransactionsPerMonth: subscriptionPlans.maxTransactionsPerMonth,
      aiChatEnabled: subscriptionPlans.aiChatEnabled,
    })
    .from(userSubscriptions)
    .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
    .where(and(eq(userSubscriptions.userId, userId), eq(userSubscriptions.status, 'active')))
    .limit(1)

  if (sub) return sub

  // Fall back to free plan defaults if no subscription row exists
  const [freePlan] = await db
    .select({
      maxAccounts: subscriptionPlans.maxAccounts,
      maxTransactionsPerMonth: subscriptionPlans.maxTransactionsPerMonth,
      aiChatEnabled: subscriptionPlans.aiChatEnabled,
    })
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.name, 'free'))
    .limit(1)

  return freePlan ?? { maxAccounts: 3, maxTransactionsPerMonth: 100, aiChatEnabled: 0 }
}

/** Returns null if allowed, or an error message string if the account limit is reached. */
export async function checkAccountLimit(userId: number): Promise<string | null> {
  const plan = await getUserPlan(userId)
  if (plan.maxAccounts < 0) return null // unlimited
  const [{ value }] = await db
    .select({ value: count() })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), isNull(accounts.deletedAt)))
  return value >= plan.maxAccounts ? 'Plan limit reached: maximum accounts' : null
}

/** Returns null if allowed, or an error message string if the monthly transaction limit is reached. */
export async function checkTransactionLimit(userId: number): Promise<string | null> {
  const plan = await getUserPlan(userId)
  if (plan.maxTransactionsPerMonth < 0) return null // unlimited
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const [{ value }] = await db
    .select({ value: count() })
    .from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      isNull(transactions.deletedAt),
      gte(transactions.date, startOfMonth),
    ))
  return value >= plan.maxTransactionsPerMonth ? 'Plan limit reached: monthly transaction limit' : null
}

/**
 * Plan limits middleware — enforces subscription plan limits on resource creation.
 * Must be added AFTER withAuth() on the router. Only fires on POST requests.
 * -1 limits mean unlimited (pro plan).
 */
export function withPlanLimit(resource: PlanResource) {
  return new Elysia()
    .onBeforeHandle(async ({ headers, request, set }) => {
      if (request.method !== 'POST') return

      const userId = parseUserIdFromToken(headers.authorization)
      if (!userId) return

      if (resource === 'accounts') {
        const err = await checkAccountLimit(userId)
        if (err) {
          set.status = 403
          return { error: err, upgrade: '/v1/billing/subscription' }
        }
      }

      if (resource === 'transactions') {
        const err = await checkTransactionLimit(userId)
        if (err) {
          set.status = 403
          return { error: err, upgrade: '/v1/billing/subscription' }
        }
      }

      if (resource === 'ai_chat') {
        const plan = await getUserPlan(userId)
        if (!plan.aiChatEnabled) {
          set.status = 403
          return { error: 'Plan limit reached: AI chat requires Pro plan', upgrade: '/v1/billing/subscription' }
        }
      }
    })
}
