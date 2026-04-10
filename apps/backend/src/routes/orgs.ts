import { Elysia, t } from 'elysia'
import { eq, and } from 'drizzle-orm'
import { db, organizations, orgMembers } from '@fast-finance/db'
import { withAuth, parseUserIdFromToken } from '../middleware/auth'

function generateInviteCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export const orgsRouter = new Elysia({ prefix: '/orgs' })
  .use(withAuth())

  // Get caller's org (as owner or member)
  .get('/me', async ({ headers, set }) => {
    const userId = parseUserIdFromToken(headers.authorization)
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }

    const [membership] = await db
      .select({
        orgId: orgMembers.orgId,
        role: orgMembers.role,
        orgName: organizations.name,
        inviteCode: organizations.inviteCode,
        ownerId: organizations.ownerId,
        createdAt: organizations.createdAt,
      })
      .from(orgMembers)
      .innerJoin(organizations, eq(orgMembers.orgId, organizations.id))
      .where(eq(orgMembers.userId, userId))
      .limit(1)

    if (!membership) {
      set.status = 404
      return { error: 'Not in any organization' }
    }

    return membership
  })

  // Create a new org (user becomes owner)
  .post(
    '/',
    async ({ headers, body, set }) => {
      const userId = parseUserIdFromToken(headers.authorization)
      if (!userId) { set.status = 401; return { error: 'Unauthorized' } }

      // User can only belong to one org
      const [existing] = await db
        .select()
        .from(orgMembers)
        .where(eq(orgMembers.userId, userId))
        .limit(1)
      if (existing) {
        set.status = 409
        return { error: 'You are already in an organization. Leave it first.' }
      }

      let inviteCode = generateInviteCode()
      // Retry on collision (astronomically unlikely with 36^6 = 2.1B space)
      const [clash] = await db.select().from(organizations).where(eq(organizations.inviteCode, inviteCode)).limit(1)
      if (clash) inviteCode = generateInviteCode()

      const [org] = await db
        .insert(organizations)
        .values({ name: body.name, ownerId: userId, inviteCode })
        .returning()

      await db.insert(orgMembers).values({ orgId: org.id, userId, role: 'owner' })

      return org
    },
    { body: t.Object({ name: t.String({ minLength: 1, maxLength: 64 }) }) },
  )

  // Join via invite code
  .post(
    '/join',
    async ({ headers, body, set }) => {
      const userId = parseUserIdFromToken(headers.authorization)
      if (!userId) { set.status = 401; return { error: 'Unauthorized' } }

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.inviteCode, body.inviteCode.toUpperCase()))
        .limit(1)

      if (!org) {
        set.status = 404
        return { error: 'Invalid invite code' }
      }

      const [alreadyMember] = await db
        .select()
        .from(orgMembers)
        .where(eq(orgMembers.userId, userId))
        .limit(1)

      if (alreadyMember) {
        set.status = 409
        return { error: 'You are already in an organization' }
      }

      await db.insert(orgMembers).values({ orgId: org.id, userId, role: 'member' })
      return { orgId: org.id, orgName: org.name }
    },
    { body: t.Object({ inviteCode: t.String() }) },
  )

  // List members of caller's org
  .get(
    '/:id/members',
    async ({ headers, params, set }) => {
      const userId = parseUserIdFromToken(headers.authorization)
      if (!userId) { set.status = 401; return { error: 'Unauthorized' } }

      // Verify caller is in this org
      const [membership] = await db
        .select()
        .from(orgMembers)
        .where(and(eq(orgMembers.orgId, params.id), eq(orgMembers.userId, userId)))
        .limit(1)

      if (!membership) {
        set.status = 403
        return { error: 'Not a member of this organization' }
      }

      return db
        .select({
          id: orgMembers.id,
          userId: orgMembers.userId,
          role: orgMembers.role,
          joinedAt: orgMembers.joinedAt,
        })
        .from(orgMembers)
        .where(eq(orgMembers.orgId, params.id))
    },
    { params: t.Object({ id: t.Number() }) },
  )

  // Remove a member (owner only, cannot remove self)
  .delete(
    '/:id/members/:memberId',
    async ({ headers, params, set }) => {
      const userId = parseUserIdFromToken(headers.authorization)
      if (!userId) { set.status = 401; return { error: 'Unauthorized' } }

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, params.id))
        .limit(1)

      if (!org || org.ownerId !== userId) {
        set.status = 403
        return { error: 'Only the owner can remove members' }
      }

      if (params.memberId === userId) {
        set.status = 400
        return { error: 'Owner cannot remove themselves. Delete the organization instead.' }
      }

      await db
        .delete(orgMembers)
        .where(and(eq(orgMembers.orgId, params.id), eq(orgMembers.userId, params.memberId)))

      set.status = 204
    },
    { params: t.Object({ id: t.Number(), memberId: t.Number() }) },
  )

  // Leave org (non-owner members only)
  .delete(
    '/me',
    async ({ headers, set }) => {
      const userId = parseUserIdFromToken(headers.authorization)
      if (!userId) { set.status = 401; return { error: 'Unauthorized' } }

      const [membership] = await db
        .select({ role: orgMembers.role, orgId: orgMembers.orgId })
        .from(orgMembers)
        .where(eq(orgMembers.userId, userId))
        .limit(1)

      if (!membership) {
        set.status = 404
        return { error: 'Not in any organization' }
      }

      if (membership.role === 'owner') {
        set.status = 400
        return { error: 'Owner cannot leave. Delete the organization or transfer ownership.' }
      }

      await db.delete(orgMembers).where(eq(orgMembers.userId, userId))
      set.status = 204
    },
  )

  // Delete org (owner only)
  .delete(
    '/:id',
    async ({ headers, params, set }) => {
      const userId = parseUserIdFromToken(headers.authorization)
      if (!userId) { set.status = 401; return { error: 'Unauthorized' } }

      const [org] = await db
        .select()
        .from(organizations)
        .where(and(eq(organizations.id, params.id), eq(organizations.ownerId, userId)))
        .limit(1)

      if (!org) {
        set.status = 403
        return { error: 'Not found or not owner' }
      }

      // Cascade deletes org_members automatically (FK ON DELETE CASCADE)
      await db.delete(organizations).where(eq(organizations.id, params.id))
      set.status = 204
    },
    { params: t.Object({ id: t.Number() }) },
  )
