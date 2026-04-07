import { Elysia, t } from 'elysia'
import { db, aiChatMessages, aiInsights } from '@fast-finance/db'
import { eq, desc, and } from 'drizzle-orm'
import { AiService } from '../domain/ai.service'

export const aiRouter = new Elysia({ prefix: '/ai' })
  .post('/chat', async ({ body, headers }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message } = body
    if (!message.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 })
    }

    try {
      const response = await AiService.chat(userId, message)
      return { response }
    } catch (error) {
      console.error('AI chat error:', error)
      return Response.json({ error: 'Failed to process message' }, { status: 500 })
    }
  }, {
    body: t.Object({ message: t.String() }),
  })
  .get('/history', async ({ headers }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const history = await AiService.getChatHistory(userId)
      return { messages: history }
    } catch (error) {
      console.error('AI history error:', error)
      return Response.json({ error: 'Failed to get history' }, { status: 500 })
    }
  })
  .delete('/history', async ({ headers }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      await AiService.clearChatHistory(userId)
      return { success: true }
    } catch (error) {
      console.error('AI clear history error:', error)
      return Response.json({ error: 'Failed to clear history' }, { status: 500 })
    }
  })
  .get('/insights', async ({ headers }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const insights = await db
        .select()
        .from(aiInsights)
        .where(eq(aiInsights.userId, userId))
        .orderBy(desc(aiInsights.createdAt))
      
      return { insights }
    } catch (error) {
      console.error('AI insights error:', error)
      return Response.json({ error: 'Failed to get insights' }, { status: 500 })
    }
  })
  .patch('/insights/:id/read', async ({ params, headers }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const insightId = parseInt(params.id)
    if (!insightId) {
      return Response.json({ error: 'Invalid insight ID' }, { status: 400 })
    }

    try {
      await db
        .update(aiInsights)
        .set({ isRead: 1 })
        .where(and(eq(aiInsights.id, insightId), eq(aiInsights.userId, userId)))
      
      return { success: true }
    } catch (error) {
      console.error('AI mark insight read error:', error)
      return Response.json({ error: 'Failed to mark insight as read' }, { status: 500 })
    }
  })
