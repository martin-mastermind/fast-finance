import { Elysia, t } from 'elysia'
import { db, users } from '@fast-finance/db'
import { validateTelegramInitData } from '../lib/telegram-auth'
import { jwtPlugin } from '../lib/jwt-plugin'

export const authRouter = new Elysia({ prefix: '/auth' })
  .use(jwtPlugin)
  .post(
    '/telegram',
    async ({ jwt, body, set }) => {
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

      const token = await jwt.sign({ userId: user.id })

      return {
        token,
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
