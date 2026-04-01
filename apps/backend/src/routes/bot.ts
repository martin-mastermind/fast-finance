import { Elysia } from 'elysia'
import { db, users, accounts, transactions, categories } from '@fast-finance/db'
import { eq, and } from 'drizzle-orm'
import { parseSmartInput } from '@fast-finance/shared'

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      is_bot: boolean
      first_name: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    date: number
    text?: string
  }
}

interface TelegramResponse {
  ok: boolean
  result?: unknown
}

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: unknown): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  const payload = {
    chat_id: chatId,
    text,
    ...(replyMarkup && { reply_markup: replyMarkup }),
    parse_mode: 'HTML',
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('Failed to send Telegram message:', err)
  }
}

export const botRouter = new Elysia({ prefix: '/bot' }).post(
  '/webhook',
  async ({ body }) => {
    const update = body as unknown as TelegramUpdate
    const message = update.message

    if (!message?.text) {
      return { ok: true }
    }

    const telegramUserId = message.from.id
    const chatId = message.chat.id
    const text = message.text

    try {
      // Find user by Telegram ID
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, String(telegramUserId)))

      if (!user) {
        const miniAppUrl = process.env.MINI_APP_URL || 'https://t.me/FastFinanceBot/app'
        await sendTelegramMessage(
          chatId,
          '📊 Сначала откройте приложение, чтобы создать счёт',
          {
            inline_keyboard: [[{ text: '💰 Открыть приложение', url: miniAppUrl }]],
          },
        )
        return { ok: true }
      }

      // Check if user has accounts
      const userAccounts = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, user.id))

      if (userAccounts.length === 0) {
        const miniAppUrl = process.env.MINI_APP_URL || 'https://t.me/FastFinanceBot/app'
        await sendTelegramMessage(
          chatId,
          '📊 Для записи операций нужно создать счёт.\nОткройте приложение и создайте первый счёт.',
          {
            inline_keyboard: [[{ text: '💰 Открыть приложение', url: miniAppUrl }]],
          },
        )
        return { ok: true }
      }

      // Parse smart input
      const parsed = parseSmartInput(text)

      if (!parsed) {
        await sendTelegramMessage(chatId, '❌ Не получилось распознать. Напишите в формате: "500 кофе" или "кофе 500"')
        return { ok: true }
      }

      // Find first account (primary)
      const primaryAccount = userAccounts[0]

      // Find matching category
      const allCategories = await db.select().from(categories)
      const matchedCategory = allCategories.find(c => c.name === parsed.suggestedCategory)

      if (!matchedCategory) {
        await sendTelegramMessage(chatId, '❌ Категория не найдена')
        return { ok: true }
      }

      // Create transaction
      await db.insert(transactions).values({
        userId: user.id,
        accountId: primaryAccount.id,
        categoryId: matchedCategory.id,
        amount: parsed.amount,
        description: parsed.description || undefined,
        date: new Date(),
      })

      // Send success response
      const sign = parsed.amount > 0 ? '✅ Доход' : '✅ Расход'
      const amountStr = Math.abs(parsed.amount).toFixed(2)
      const categoryName = matchedCategory.name
      const desc = parsed.description ? ` (${parsed.description})` : ''

      await sendTelegramMessage(chatId, `${sign}: ${amountStr} ${user.currency} • ${categoryName}${desc}`)

      return { ok: true }
    } catch (err) {
      console.error('Bot webhook error:', err)
      await sendTelegramMessage(chatId, '❌ Ошибка при сохранении операции')
      return { ok: true }
    }
  },
)
