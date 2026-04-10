import { db } from './client'
import {
  users,
  accounts,
  transactions,
  categories,
  subscriptionPlans,
  userSubscriptions,
} from './schema'
import { eq } from 'drizzle-orm'

async function seed() {
  console.log('Seeding demo data...')

  // 1. Demo user
  const [user] = await db
    .insert(users)
    .values({
      telegramId: '00000001',
      username: 'demo',
      currency: 'RUB',
      role: 'user',
    })
    .onConflictDoUpdate({
      target: users.telegramId,
      set: { username: 'demo' },
    })
    .returning()

  console.log(`User: id=${user.id} username=${user.username}`)

  // 2. Assign free plan subscription
  const [freePlan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.name, 'free'))
    .limit(1)

  if (freePlan) {
    await db
      .insert(userSubscriptions)
      .values({
        userId: user.id,
        planId: freePlan.id,
        status: 'active',
      })
      .onConflictDoUpdate({
        target: userSubscriptions.userId,
        set: { planId: freePlan.id, status: 'active' },
      })
    console.log(`Subscription: free plan (id=${freePlan.id})`)
  }

  // 3. Demo accounts
  const accountRows = await db
    .insert(accounts)
    .values([
      { userId: user.id, name: 'Основной счёт', balance: 50000, currency: 'RUB', type: 'checking', sortOrder: 0 },
      { userId: user.id, name: 'Сбережения', balance: 120000, currency: 'RUB', type: 'savings', sortOrder: 1 },
      { userId: user.id, name: 'USD счёт', balance: 500, currency: 'USD', type: 'checking', sortOrder: 2 },
    ])
    .returning()

  const mainAccount = accountRows[0]
  console.log(`Accounts: ${accountRows.length} created`)

  // 4. Look up seeded categories
  const [salaryCategory] = await db
    .select()
    .from(categories)
    .where(eq(categories.name, 'Зарплата'))
    .limit(1)

  const [foodCategory] = await db
    .select()
    .from(categories)
    .where(eq(categories.name, 'Еда'))
    .limit(1)

  const [transportCategory] = await db
    .select()
    .from(categories)
    .where(eq(categories.name, 'Транспорт'))
    .limit(1)

  const now = new Date()
  const txValues = []

  if (salaryCategory) {
    txValues.push({
      userId: user.id,
      accountId: mainAccount.id,
      categoryId: salaryCategory.id,
      amount: 80000,
      currency: 'RUB' as const,
      description: 'Зарплата за месяц',
      date: new Date(now.getFullYear(), now.getMonth(), 1),
    })
  }

  if (foodCategory) {
    for (let i = 1; i <= 5; i++) {
      txValues.push({
        userId: user.id,
        accountId: mainAccount.id,
        categoryId: foodCategory.id,
        amount: -(500 + i * 100),
        currency: 'RUB' as const,
        description: `Продукты (покупка ${i})`,
        date: new Date(now.getFullYear(), now.getMonth(), i + 1),
      })
    }
  }

  if (transportCategory) {
    for (let i = 1; i <= 4; i++) {
      txValues.push({
        userId: user.id,
        accountId: mainAccount.id,
        categoryId: transportCategory.id,
        amount: -150,
        currency: 'RUB' as const,
        description: 'Проезд',
        date: new Date(now.getFullYear(), now.getMonth(), i + 2),
      })
    }
  }

  if (txValues.length > 0) {
    await db.insert(transactions).values(txValues)
    console.log(`Transactions: ${txValues.length} created`)
  }

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
