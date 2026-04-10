import { Elysia, t } from 'elysia'
import { db, aiInsights } from '@fast-finance/db'
import { eq, desc, and } from 'drizzle-orm'
import { AiService } from '../domain/ai.service'
import { withAuth, parseUserIdFromToken } from '../middleware/auth'
import { withPlanLimit } from '../middleware/plan-limits'

export const aiRouter = new Elysia({ prefix: '/ai' })
  .use(withAuth())
  .use(withPlanLimit('ai_chat'))
  .post('/chat', async ({ body, headers, set }) => {
    const userId = parseUserIdFromToken(headers.authorization)
    const { message } = body
    if (!message.trim()) {
      set.status = 400
      return { error: 'Message is required' }
    }
    if (message.length > 2000) {
      set.status = 400
      return { error: 'Message too long (max 2000 characters)' }
    }
    try {
      const response = await AiService.chat(userId, message)
      return { response }
    } catch {
      set.status = 500
      return { error: 'Failed to process message' }
    }
  }, {
    body: t.Object({ message: t.String() }),
  })
  .get('/history', async ({ headers, set }) => {
    const userId = parseUserIdFromToken(headers.authorization)
    try {
      const history = await AiService.getChatHistory(userId)
      return { messages: history }
    } catch {
      set.status = 500
      return { error: 'Failed to get history' }
    }
  })
  .delete('/history', async ({ headers, set }) => {
    const userId = parseUserIdFromToken(headers.authorization)
    try {
      await AiService.clearChatHistory(userId)
      return { success: true }
    } catch {
      set.status = 500
      return { error: 'Failed to clear history' }
    }
  })
  .get('/insights', async ({ headers, query, set }) => {
    const userId = parseUserIdFromToken(headers.authorization)
    const limit = Math.min(parseInt(String(query.limit ?? '50')), 200)
    const offset = parseInt(String(query.offset ?? '0'))
    try {
      const insights = await db
        .select()
        .from(aiInsights)
        .where(eq(aiInsights.userId, userId))
        .orderBy(desc(aiInsights.createdAt))
        .limit(limit)
        .offset(offset)
      return { insights }
    } catch {
      set.status = 500
      return { error: 'Failed to get insights' }
    }
  }, {
    query: t.Object({
      limit: t.Optional(t.Numeric()),
      offset: t.Optional(t.Numeric()),
    }),
  })
  .patch('/insights/:id/read', async ({ params, headers, set }) => {
    const userId = parseUserIdFromToken(headers.authorization)
    const insightId = parseInt(params.id)
    if (!insightId) {
      set.status = 400
      return { error: 'Invalid insight ID' }
    }
    try {
      await db
        .update(aiInsights)
        .set({ isRead: 1 })
        .where(and(eq(aiInsights.id, insightId), eq(aiInsights.userId, userId)))
      return { success: true }
    } catch {
      set.status = 500
      return { error: 'Failed to mark insight as read' }
    }
  })
