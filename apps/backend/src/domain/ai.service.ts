import Groq from 'groq-sdk'
import { db, transactions, categories, accounts, aiChatMessages, users, currencyRates } from '@fast-finance/db'
import { eq, desc } from 'drizzle-orm'
import { TransactionService } from './transaction.service'
import { CurrencyService } from './currency.service'

if (!process.env.GROQ_API_KEY) {
  throw new Error('Missing required environment variable: GROQ_API_KEY')
}
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function getSystemPrompt(displayCurrency: string): string {
  const currencySymbols: Record<string, string> = { USD: '$', RUB: '₽', BYN: 'Br' }
  const symbol = currencySymbols[displayCurrency] || displayCurrency

  return `Ты — опытный финансовый советник с 15-летним стажем работы в личных финансах и управлении бюджетом. Твоя задача — давать профессиональные, конкретные и actionable советы на основе реальных данных пользователя.

ВАЖНО: Всегда отвечай ТОЛЬКО на русском языке, даже если вопрос задан на другом языке.

Валюта пользователя: ${displayCurrency} (${symbol}). Все суммы в ответах указывай в ${displayCurrency}.

Принципы работы:
- Анализируй реальные данные пользователя, не давай общих фраз
- Используй конкретные числа и проценты из контекста
- Давай 2-3 конкретных actionable рекомендации, а не общие советы
- Применяй финансовые концепции (правило 50/30/20, фонд экстренных ситуаций, диверсификация и др.)
- Если данных недостаточно — скажи что именно нужно для анализа

Формат ответов:
- Структура: краткий анализ → конкретные рекомендации
- **Жирный** для ключевых сумм и показателей
- Списки для рекомендаций (2-3 пункта максимум)
- Эмодзи умеренно — только там, где усиливают смысл
- Ответ лаконичный, без воды

Если вопрос не связан с финансами — вежливо объясни, что специализируешься на личных финансах.`
}

export const AiService = {
  async chat(userId: number, userMessage: string): Promise<string> {
    const messages = await this.getChatHistory(userId)

    const [userRecord] = await db.select({ currency: users.currency }).from(users).where(eq(users.id, userId)).limit(1)
    const displayCurrency = userRecord?.currency || 'USD'

    const systemMsg: ChatMessage = { role: 'system', content: getSystemPrompt(displayCurrency) }
    const userMsg: ChatMessage = { role: 'user', content: userMessage }

    const financialContext = await this.getFinancialContext(userId, displayCurrency)
    const contextMsg: ChatMessage = {
      role: 'system',
      content: `Финансовые данные пользователя:\n${financialContext}`
    }

    const allMessages = [systemMsg, contextMsg, ...messages.slice(-10), userMsg]

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: allMessages as Groq.Chat.ChatCompletionMessage[],
        temperature: 0.7,
        max_tokens: 1024,
      })
      
      const assistantResponse = completion.choices[0]?.message?.content || 'Извините, не удалось получить ответ. Попробуйте позже.'
      
      await db.insert(aiChatMessages).values({
        userId,
        role: 'user',
        content: userMessage,
      })
      
      await db.insert(aiChatMessages).values({
        userId,
        role: 'assistant',
        content: assistantResponse,
      })
      
      return assistantResponse
    } catch (error) {
      console.error('Groq API error:', error)
      return this.getFallbackResponse(userMessage)
    }
  },

  async getFinancialContext(userId: number, displayCurrency: string): Promise<string> {
    try {
      const rates = await CurrencyService.getRates()

      const convertToDisplay = (amount: number, fromCurrency: string): number => {
        const fromRate = rates[fromCurrency] ?? 1
        const toRate = rates[displayCurrency] ?? 1
        return (amount * fromRate) / toRate
      }

      const fmt = (amount: number) => `${amount.toFixed(2)} ${displayCurrency}`

      const stats = await TransactionService.getTransactionStats(userId, 'month')

      const recentTransactions = await db
        .select({
          amount: transactions.amount,
          currency: transactions.currency,
          description: transactions.description,
          date: transactions.date,
        })
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.date))
        .limit(10)

      const userAccounts = await db
        .select({ name: accounts.name, balance: accounts.balance, currency: accounts.currency })
        .from(accounts)
        .where(eq(accounts.userId, userId))

      // Stats are already in USD (base), convert to display currency
      const usdToDisplay = (amount: number) => convertToDisplay(amount, 'USD')

      let context = `Валюта отображения: ${displayCurrency}\n\nТекущий месяц:\n`
      context += `- Общий доход: ${fmt(usdToDisplay(stats.totalIncome))}\n`
      context += `- Общие расходы: ${fmt(usdToDisplay(stats.totalExpense))}\n`
      context += `- Баланс (доходы − расходы): ${fmt(usdToDisplay(stats.balance))}\n`

      if (stats.expenseByCategory.length > 0) {
        context += `\nРасходы по категориям:\n`
        stats.expenseByCategory.forEach(cat => {
          context += `- ${cat.categoryName}: ${fmt(usdToDisplay(cat.amount))} (${cat.percentage}%)\n`
        })
      }

      if (userAccounts.length > 0) {
        context += `\nСчета пользователя:\n`
        userAccounts.forEach(acc => {
          const inDisplay = convertToDisplay(Number(acc.balance), acc.currency)
          context += `- ${acc.name} (${acc.currency}): ${fmt(inDisplay)}\n`
        })
      }

      if (recentTransactions.length > 0) {
        context += `\nПоследние операции:\n`
        recentTransactions.slice(0, 5).forEach(tx => {
          const inDisplay = convertToDisplay(Number(tx.amount), tx.currency)
          const sign = inDisplay > 0 ? '+' : ''
          const date = new Date(tx.date).toLocaleDateString('ru')
          const desc = tx.description ? ` (${tx.description})` : ''
          context += `- ${date}: ${sign}${fmt(inDisplay)}${desc}\n`
        })
      }

      return context
    } catch (error) {
      console.error('Error getting financial context:', error)
      return 'Не удалось получить данные о финансах'
    }
  },

  async getChatHistory(userId: number, limit: number = 20): Promise<ChatMessage[]> {
    const messages = await db
      .select({ role: aiChatMessages.role, content: aiChatMessages.content })
      .from(aiChatMessages)
      .where(eq(aiChatMessages.userId, userId))
      .orderBy(desc(aiChatMessages.createdAt))
      .limit(limit)
    
    return messages.reverse().map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
  },

  async clearChatHistory(userId: number): Promise<void> {
    await db.delete(aiChatMessages).where(eq(aiChatMessages.userId, userId))
  },

  getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('совет') || lowerMessage.includes('экономить')) {
      return `💡 Вот несколько советов по экономии:\n\n` +
        `• Откладывайте 20% от любого дохода\n` +
        `• Отслеживайте мелкие расходы — они накапливаются\n` +
        `• Используйте правило «24 часов» перед покупкой\n` +
        `• Ставьте конкретные финансовые цели`
    }
    
    if (lowerMessage.includes('бюджет')) {
      return `📊 Для эффективного бюджетирования:\n\n` +
        `• Определите обязательные расходы (жильё, еда, транспорт)\n` +
        `• Правило 50/30/20: 50% на нужды, 30% на желания, 20% на сбережения\n` +
        `• Записывайте все расходы — так легче контролировать`
    }
    
    if (lowerMessage.includes('доход') || lowerMessage.includes('заработать')) {
      return `💰 Идеи для увеличения дохода:\n\n` +
        `• Начните подработку в свободное время\n` +
        `• Монетизируйте хобби\n` +
        `• Инвестируйте в образование\n` +
        `• Создайте пассивный доход`
    }
    
    return `🤔 Я пока не могу обработать этот запрос. Попробуйте спросить о:\n\n` +
      `• Ваших расходах и доходах\n` +
      `• Советах по экономии\n` +
      `• Бюджетировании\n` +
      `• Финансовых целях`
  },
}
