import { Elysia } from 'elysia'
import { eq, and, isNull, gte, count } from 'drizzle-orm'
import { db, accounts, transactions, subscriptionPlans, userSubscriptions } from '@fast-finance/db'
import { parseUserIdFromToken } from './auth'

type PlanResource = 'accounts' | 'transactions' | 'ai_chat'

async function getUserPlan(userId: number) {
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

      const plan = await getUserPlan(userId)

      if (resource === 'accounts') {
        if (plan.maxAccounts < 0) return // unlimited
        const [{ value }] = await db
          .select({ value: count() })
          .from(accounts)
          .where(and(eq(accounts.userId, userId), isNull(accounts.deletedAt)))
        if (value >= plan.maxAccounts) {
          set.status = 403
          return { error: 'Plan limit reached: maximum accounts', upgrade: '/v1/billing/subscription' }
        }
      }

      if (resource === 'transactions') {
        if (plan.maxTransactionsPerMonth < 0) return // unlimited
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
        if (value >= plan.maxTransactionsPerMonth) {
          set.status = 403
          return { error: 'Plan limit reached: monthly transaction limit', upgrade: '/v1/billing/subscription' }
        }
      }

      if (resource === 'ai_chat') {
        if (!plan.aiChatEnabled) {
          set.status = 403
          return { error: 'Plan limit reached: AI chat requires Pro plan', upgrade: '/v1/billing/subscription' }
        }
      }
    })
}
