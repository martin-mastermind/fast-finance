import Groq from 'groq-sdk'
import { db, transactions, categories, accounts, aiChatMessages } from '@fast-finance/db'
import { eq, desc, gte, lt, and, sql } from 'drizzle-orm'
import { TransactionService } from './transaction.service'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function getSystemPrompt(): string {
  return `Ты — финансовый ассистент в приложении Fast Finance. Твоя задача — помогать пользователям управлять личными финансами.

Отвечай кратко и по делу на русском языке. Используй эмодзи для наглядности.

Ты можешь:
- Анализировать расходы и доходы
- Давать советы по экономии
- Помогать с бюджетированием
- Объяснять финансовые термины простым языком

Если пользователь спрашивает что-то не связанное с финансами, вежливо укажи, что твоя специализация — личные финансы.

Формат ответов:
- Используй списки для нескольких пунктов
- Выделяй ключевые числа жирным
- Добавляй релевантные эмодзи`
}

export const AiService = {
  async chat(userId: number, userMessage: string): Promise<string> {
    const messages = await this.getChatHistory(userId)
    
    const systemMsg: ChatMessage = { role: 'system', content: getSystemPrompt() }
    const userMsg: ChatMessage = { role: 'user', content: userMessage }
    
    const financialContext = await this.getFinancialContext(userId)
    const contextMsg: ChatMessage = {
      role: 'user',
      content: `Контекст о пользователе:\n${financialContext}`
    }
    
    const allMessages = [systemMsg, contextMsg, ...messages.slice(-10), userMsg]
    
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
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

  async getFinancialContext(userId: number): Promise<string> {
    try {
      const stats = await TransactionService.getTransactionStats(userId, 'month')
      
      const recentTransactions = await db
        .select({
          amount: transactions.amount,
          description: transactions.description,
          date: transactions.date,
        })
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.date))
        .limit(10)
      
      const userAccounts = await db
        .select({ name: accounts.name, balance: accounts.balance })
        .from(accounts)
        .where(eq(accounts.userId, userId))
      
      let context = `Текущий месяц:\n`
      context += `- Общий доход: ${stats.totalIncome.toFixed(2)}\n`
      context += `- Общие расходы: ${stats.totalExpense.toFixed(2)}\n`
      context += `- Баланс: ${stats.balance.toFixed(2)}\n`
      
      if (stats.expenseByCategory.length > 0) {
        context += `\nРасходы по категориям:\n`
        stats.expenseByCategory.forEach(cat => {
          context += `- ${cat.categoryName}: ${cat.amount.toFixed(2)} (${cat.percentage}%)\n`
        })
      }
      
      if (userAccounts.length > 0) {
        context += `\nСчета пользователя:\n`
        userAccounts.forEach(acc => {
          context += `- ${acc.name}: ${acc.balance.toFixed(2)}\n`
        })
      }
      
      if (recentTransactions.length > 0) {
        context += `\nПоследние операции:\n`
        recentTransactions.slice(0, 5).forEach(tx => {
          const sign = tx.amount > 0 ? '+' : ''
          const date = new Date(tx.date).toLocaleDateString('ru')
          context += `- ${date}: ${sign}${tx.amount.toFixed(2)}${tx.description ? ` (${tx.description})` : ''}\n`
        })
      }
      
      return context || 'Нет данных о финансах пользователя'
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
