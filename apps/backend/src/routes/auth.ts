import { Elysia, t } from 'elysia'
import { db, users } from '@fast-finance/db'
import { validateTelegramInitData } from '../lib/telegram-auth'

export const authRouter = new Elysia({ prefix: '/auth' })
  .post(
    '/telegram',
    async ({ body, set }) => {
      const { initData } = body
      const botToken = process.env.TELEGRAM_BOT_TOKEN

      if (!botToken) {
        set.status = 500
        return { error: 'Bot token not configured' }
      }

      let telegramUserId: number
      let telegramUsername: string | undefined

      // Dev bypass
      if (process.env.NODE_ENV === 'development' && initData === 'dev_bypass') {
        telegramUserId = 123456789
        telegramUsername = 'devuser'
      } else {
        const tgUser = await validateTelegramInitData(initData, botToken)
        if (!tgUser) {
          set.status = 401
          return { error: 'Invalid Telegram auth data' }
        }
        telegramUserId = tgUser.id
        telegramUsername = tgUser.username
      }

      const [user] = await db
        .insert(users)
        .values({
          telegramId: String(telegramUserId),
          username: telegramUsername || null,
          currency: 'RUB',
        })
        .onConflictDoUpdate({
          target: users.telegramId,
          set: { username: telegramUsername || null },
        })
        .returning()

      return {
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
