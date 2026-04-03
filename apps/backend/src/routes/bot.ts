import { Elysia } from 'elysia'
import { db, users, accounts, transactions, categories } from '@fast-finance/db'
import { eq, and } from 'drizzle-orm'
import { parseSmartInput } from '@fast-finance/shared'

interface TelegramUpdate {
  update_id: number
  callback_query?: {
    id: string
    from: {
      id: number
      is_bot: boolean
      first_name: string
      username?: string
    }
    message?: {
      message_id: number
      chat: { id: number }
      text?: string
    }
    data: string
  }
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

type TransactionMode = 'idle' | 'awaiting_amount' | 'awaiting_category'
interface UserSession {
  mode: TransactionMode
  type?: 'income' | 'expense'
  amount?: number
  description?: string
}

const userSessions = new Map<number, UserSession>()

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

async function editTelegramMessage(chatId: number, messageId: number, text: string, replyMarkup?: unknown): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return

  const url = `https://api.telegram.org/bot${botToken}/editMessageText`
  const payload = {
    chat_id: chatId,
    message_id: messageId,
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
    console.error('Failed to edit Telegram message:', err)
  }
}

const typeKeyboard = {
  inline_keyboard: [
    [{ text: '💰 Доход', callback_data: 'type_income' }, { text: '💸 Расход', callback_data: 'type_expense' }],
  ],
}

const mainKeyboard = {
  inline_keyboard: [
    [{ text: '💰 Доход', callback_data: 'type_income' }, { text: '💸 Расход', callback_data: 'type_expense' }],
    [{ text: '📊 Открыть приложение', url: process.env.MINI_APP_URL || 'https://t.me/FastFinanceBot/app' }],
  ],
}

function buildCategoryKeyboard(cats: { id: number; name: string }[], type: 'income' | 'expense') {
  const buttons: { text: string; callback_data: string }[] = cats.slice(0, 8).map(c => ({
    text: c.name,
    callback_data: `cat_${c.id}`,
  }))
  const rows: { text: string; callback_data: string }[][] = []
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2))
  }
  rows.push([{ text: '⬅️ Назад', callback_data: 'back_type' }])
  return { inline_keyboard: rows }
}

function buildAmountKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '⬅️ Назад', callback_data: 'back_category' }],
    ],
  }
}

function buildMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '💰 Доход', callback_data: 'type_income' }, { text: '💸 Расход', callback_data: 'type_expense' }],
      [{ text: '📊 Открыть приложение', url: process.env.MINI_APP_URL || 'https://t.me/FastFinanceBot/app' }],
    ],
  }
}

export const botRouter = new Elysia({ prefix: '/bot' }).post(
  '/webhook',
  async ({ body }) => {
    const update = body as unknown as TelegramUpdate

    // Handle callback query (button press)
    if (update.callback_query) {
      const cq = update.callback_query
      const telegramUserId = cq.from.id
      const chatId = cq.message?.chat.id || cq.from.id
      const messageId = cq.message?.message_id
      const callbackData = cq.data

      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, String(telegramUserId)))

        if (!user) {
          await sendTelegramMessage(chatId, '❌ Пользователь не найден. Откройте приложение.')
          return { ok: true }
        }

        const allCategories = await db.select().from(categories)

        if (callbackData === 'type_income' || callbackData === 'expense') {
          const type = callbackData === 'type_income' ? 'income' : 'expense'
          userSessions.set(telegramUserId, { mode: 'awaiting_amount', type })
          const typeLabel = type === 'income' ? '💰 Доход' : '💸 Расход'
          if (messageId) {
            await editTelegramMessage(chatId, messageId, `${typeLabel}\n\nВведите сумму:`, buildAmountKeyboard())
          } else {
            await sendTelegramMessage(chatId, `${typeLabel}\n\nВведите сумму:`, buildAmountKeyboard())
          }
          return { ok: true }
        }

        if (callbackData.startsWith('cat_')) {
          const session = userSessions.get(telegramUserId)
          if (!session || session.mode !== 'awaiting_amount') {
            await sendTelegramMessage(chatId, '❌ Сессия истекла. Начните заново.', buildMainMenuKeyboard())
            return { ok: true }
          }

          const categoryId = parseInt(callbackData.replace('cat_', ''))
          const category = allCategories.find(c => c.id === categoryId)

          if (!category || !session.amount) {
            await sendTelegramMessage(chatId, '❌ Ошибка. Начните заново.', buildMainMenuKeyboard())
            userSessions.delete(telegramUserId)
            return { ok: true }
          }

          const userAccounts = await db
            .select()
            .from(accounts)
            .where(eq(accounts.userId, user.id))

          if (!userAccounts?.[0]) {
            await sendTelegramMessage(chatId, '❌ Нет счетов. Создайте счёт в приложении.')
            userSessions.delete(telegramUserId)
            return { ok: true }
          }

          const sign = session.type === 'income' ? '+' : '-'
          await db.insert(transactions).values({
            userId: user.id,
            accountId: userAccounts[0].id,
            categoryId: category.id,
            amount: session.type === 'income' ? session.amount : -session.amount,
            description: session.description,
            date: new Date(),
          })

          await sendTelegramMessage(
            chatId,
            `✅ Сохранено!\n\n${sign}${session.amount.toFixed(2)} ${user.currency} • ${category.name}${session.description ? ` (${session.description})` : ''}`,
            buildMainMenuKeyboard(),
          )

          userSessions.delete(telegramUserId)
          return { ok: true }
        }

        if (callbackData === 'back_type') {
          userSessions.delete(telegramUserId)
          if (messageId) {
            await editTelegramMessage(chatId, messageId, 'Выберите тип операции:', mainKeyboard)
          } else {
            await sendTelegramMessage(chatId, 'Выберите тип операции:', mainKeyboard)
          }
          return { ok: true }
        }

        if (callbackData === 'back_category') {
          const session = userSessions.get(telegramUserId)
          if (!session) {
            await sendTelegramMessage(chatId, 'Выберите тип операции:', mainKeyboard)
            return { ok: true }
          }
          session.mode = 'awaiting_amount'
          const typeLabel = session.type === 'income' ? '💰 Доход' : '💸 Расход'
          if (messageId) {
            await editTelegramMessage(chatId, messageId, `${typeLabel}\n\nВведите сумму:`, buildAmountKeyboard())
          } else {
            await sendTelegramMessage(chatId, `${typeLabel}\n\nВведите сумму:`, buildAmountKeyboard())
          }
          return { ok: true }
        }

        return { ok: true }
      } catch (err) {
        console.error('Bot callback error:', err)
        await sendTelegramMessage(chatId, '❌ Ошибка. Попробуйте снова.')
        userSessions.delete(telegramUserId)
        return { ok: true }
      }
    }

    // Handle regular message
    const message = update.message

    if (!message?.text) {
      return { ok: true }
    }

    const telegramUserId = message.from.id
    const chatId = message.chat.id
    const text = message.text

    // Check if waiting for amount
    const session = userSessions.get(telegramUserId)
    if (session && session.mode === 'awaiting_amount') {
      const amount = parseFloat(text.replace(',', '.'))
      if (isNaN(amount) || amount <= 0) {
        await sendTelegramMessage(chatId, '❌ Введите корректную сумму (число).')
        return { ok: true }
      }

      session.amount = amount
      session.mode = 'awaiting_category'

      const allCategories = await db.select().from(categories)
      const filteredCats = allCategories.filter(c => c.type === session.type)
      const typeLabel = session.type === 'income' ? '💰 Доход' : '💸 Расход'

      await sendTelegramMessage(
        chatId,
        `${typeLabel}: ${amount.toFixed(2)}\n\nВыберите категорию:`,
        buildCategoryKeyboard(filteredCats, session.type!),
      )
      return { ok: true }
    }

    // Normal message handling - smart input
    try {
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

      const userAccounts = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, user.id))

      if (!userAccounts?.[0]) {
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

      const parsed = parseSmartInput(text)

      if (!parsed) {
        await sendTelegramMessage(chatId, 
          '❌ Не получилось распознать.\n\nИспользуйте кнопки ниже или напишите в формате: "500 кофе"',
          mainKeyboard,
        )
        return { ok: true }
      }

      const primaryAccount = userAccounts[0]

      const allCategories = await db.select().from(categories)
      const matchedCategory = allCategories.find(c => c.name === parsed.suggestedCategory)

      if (!matchedCategory) {
        await sendTelegramMessage(chatId, '❌ Категория не найдена')
        return { ok: true }
      }

      await db.insert(transactions).values({
        userId: user.id,
        accountId: primaryAccount.id,
        categoryId: matchedCategory.id,
        amount: parsed.amount,
        description: parsed.description || undefined,
        date: new Date(),
      })

      const sign = parsed.amount > 0 ? '✅ Доход' : '✅ Расход'
      const amountStr = Math.abs(parsed.amount).toFixed(2)
      const categoryName = matchedCategory.name
      const desc = parsed.description ? ` (${parsed.description})` : ''

      await sendTelegramMessage(chatId, `${sign}: ${amountStr} ${user.currency} • ${categoryName}${desc}`, buildMainMenuKeyboard())

      return { ok: true }
    } catch (err) {
      console.error('Bot webhook error:', err)
      await sendTelegramMessage(chatId, '❌ Ошибка при сохранении операции')
      return { ok: true }
    }
  },
)
