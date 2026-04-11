import { Elysia, t } from 'elysia'
import { eq, and, isNull, gt, desc } from 'drizzle-orm'
import { db, users, refreshTokens, subscriptionPlans, userSubscriptions } from '@fast-finance/db'
import { validateTelegramInitData } from '../lib/telegram-auth'
import { jwtPlugin, refreshJwtPlugin } from '../lib/jwt-plugin'
import { parseUserIdFromToken } from '../middleware/auth'

export const authRouter = new Elysia({ prefix: '/auth' })
  .use(jwtPlugin)
  .use(refreshJwtPlugin)
  .post(
    '/telegram',
    async ({ jwt, refreshJwt, body, set }) => {
      const { initData } = body
      const botToken = process.env.TELEGRAM_BOT_TOKEN!

      let tgUser: { id: number; username?: string } | null = null

      // Dev bypass only in non-production environments
      if (initData === 'dev_bypass' && process.env.NODE_ENV !== 'production') {
        tgUser = { id: 12345678, username: 'dev_user' }
      } else {
        tgUser = await validateTelegramInitData(initData, botToken)
      }

      if (!tgUser) {
        set.status = 401
        return { error: 'Invalid Telegram auth data' }
      }

      const [user] = await db
        .insert(users)
        .values({
          telegramId: String(tgUser.id),
          username: tgUser.username || null,
          currency: 'RUB',
        })
        .onConflictDoUpdate({
          target: users.telegramId,
          set: { username: tgUser.username || null },
        })
        .returning()

      // Ensure user has a free plan subscription row (idempotent — safe for existing users)
      const [freePlan] = await db
        .select({ id: subscriptionPlans.id })
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, 'free'))
        .limit(1)
      if (freePlan) {
        await db
          .insert(userSubscriptions)
          .values({ userId: user.id, planId: freePlan.id, status: 'active' })
          .onConflictDoNothing({ target: userSubscriptions.userId })
      }

      const token = await jwt.sign({ userId: user.id })

      // Issue refresh token and persist it for revocation support
      const refreshToken = await refreshJwt.sign({ userId: user.id })
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const [sessionRow] = await db.insert(refreshTokens).values({
        userId: user.id,
        token: refreshToken,
        expiresAt,
      }).returning()

      return {
        token,
        refreshToken,
        sessionId: sessionRow.id,
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          currency: user.currency,
        },
      }
    },
    {
      body: t.Object({ initData: t.String() }),
    },
  )
  .post(
    '/refresh',
    async ({ refreshJwt, jwt, body, set }) => {
      const { refreshToken } = body

      // Verify the refresh JWT signature and expiry
      const payload = await refreshJwt.verify(refreshToken)
      if (!payload || typeof payload.userId !== 'number') {
        set.status = 401
        return { error: 'Invalid refresh token' }
      }

      const now = new Date()

      // Check the token exists in DB and has not been revoked or expired
      const [storedToken] = await db
        .select()
        .from(refreshTokens)
        .where(
          and(
            eq(refreshTokens.token, refreshToken),
            eq(refreshTokens.userId, payload.userId),
            isNull(refreshTokens.revokedAt),
            gt(refreshTokens.expiresAt, now),
          ),
        )
        .limit(1)

      if (!storedToken) {
        set.status = 401
        return { error: 'Refresh token revoked or expired' }
      }

      // Revoke old refresh token (rotation — one-time use)
      await db
        .update(refreshTokens)
        .set({ revokedAt: now })
        .where(eq(refreshTokens.id, storedToken.id))

      // Issue new token pair
      const newToken = await jwt.sign({ userId: payload.userId })
      const newRefreshToken = await refreshJwt.sign({ userId: payload.userId })
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      await db.insert(refreshTokens).values({
        userId: payload.userId,
        token: newRefreshToken,
        expiresAt,
      })

      return { token: newToken, refreshToken: newRefreshToken }
    },
    {
      body: t.Object({ refreshToken: t.String() }),
    },
  )
  .post(
    '/logout',
    async ({ refreshJwt, body, set }) => {
      const { refreshToken } = body

      const payload = await refreshJwt.verify(refreshToken)
      if (!payload || typeof payload.userId !== 'number') {
        set.status = 204
        return
      }

      // Revoke the refresh token
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(refreshTokens.token, refreshToken),
            eq(refreshTokens.userId, payload.userId),
            isNull(refreshTokens.revokedAt),
          ),
        )

      set.status = 204
      return
    },
    {
      body: t.Object({ refreshToken: t.String() }),
    },
  )
  .get('/sessions', async ({ headers, set }) => {
    const userId = parseUserIdFromToken(headers.authorization)
    if (!userId) {
      set.status = 401
      return { error: 'Unauthorized' }
    }
    const now = new Date()
    return db
      .select({ id: refreshTokens.id, createdAt: refreshTokens.createdAt, expiresAt: refreshTokens.expiresAt })
      .from(refreshTokens)
      .where(and(
        eq(refreshTokens.userId, userId),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, now),
      ))
      .orderBy(desc(refreshTokens.createdAt))
  })
  .delete(
    '/sessions/:id',
    async ({ headers, params, set }) => {
      const userId = parseUserIdFromToken(headers.authorization)
      if (!userId) {
        set.status = 401
        return { error: 'Unauthorized' }
      }
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(and(
          eq(refreshTokens.id, params.id),
          eq(refreshTokens.userId, userId),
          isNull(refreshTokens.revokedAt),
        ))
      set.status = 204
    },
    { params: t.Object({ id: t.String() }) },
  )
