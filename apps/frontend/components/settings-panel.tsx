'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { formatCurrency } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, X, Building2, Grid3x3, Pencil, ArrowUp, ArrowDown, Download, ShieldAlert, Shield, Users, Copy, LogOut } from 'lucide-react'
import { useFinanceStore } from '@/store/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MotionButton } from '@/components/ui/motion-button'
import { getCategoryIcon } from '@/lib/icon-map'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations, useLocale } from 'next-intl'
import { useLocaleStore, SUPPORTED_LOCALES, LOCALE_LABELS } from '@/store/locale'

interface Props {
  userId: number
}

const CURRENCY_LABELS: Record<string, string> = {
  RUB: '₽',
  BYN: 'Br',
  USD: '$',
}

const CURRENCIES = ['RUB', 'BYN', 'USD'] as const

const EMOJI_ICONS = [
  '🍔', '🚗', '🏠', '💊', '🛒', '📱', '🎮', '👗', '✈️', '🎁',
  '💰', '💼', '🏋️', '🎵', '📚', '☕', '🚕', '🔧', '🎨', '🐾',
  '🌸', '🔥', '💡', '⚡', '🎯', '🏆', '📊', '💳', '🏦', '🎓',
]

const CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
]

interface Category {
  id: number
  name: string
  icon: string
  type: string
  userId: number | null
}

export function SettingsPanel({ userId }: Props) {
  const { token, logout, currentSessionId } = useAuthStore()
  const api = createApiClient(token || '')
  const t = useTranslations('settings')
  const tTx = useTranslations('transactions')
  const tWiz = useTranslations('wizard')
  const tOrg = useTranslations('org')
  const locale = useLocale()
  const { locale: currentLocale, setLocale } = useLocaleStore()
  const queryClient = useQueryClient()
  const { transactionType, setTransactionType, isAddCategoryModalOpen, setAddCategoryModalOpen, setPlanLimitModalOpen } = useFinanceStore()

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountCurrency, setNewAccountCurrency] = useState('RUB')
  const [newAccountType, setNewAccountType] = useState<'checking' | 'savings'>('checking')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [orgView, setOrgView] = useState<'none' | 'create' | 'join'>('none')
  const [orgNewName, setOrgNewName] = useState('')
  const [orgInviteInput, setOrgInviteInput] = useState('')
  const [confirmLeave, setConfirmLeave] = useState(false)

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts', userId],
    queryFn: () => api.accounts.list(),
  })

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', userId],
    queryFn: () => api.categories.list(),
  })

  const createAccountMutation = useMutation({
    mutationFn: (data: { name: string; currency: string; type: string }) =>
      api.accounts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] })
      setIsAddAccountOpen(false)
      setNewAccountName('')
      setNewAccountCurrency('RUB')
      setNewAccountType('checking')
      toast.success('Account created')
    },
    onError: (err: Error) => {
      if (err.message.includes('Plan limit reached')) {
        setPlanLimitModalOpen(true)
      } else {
        toast.error(err.message || 'Failed to create account')
      }
    },
  })

  const deleteAccountMutation = useMutation({
    mutationFn: (id: number) => api.accounts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] })
      toast.success('Account deleted')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete account'),
  })

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { sortOrder?: number; type?: string } }) =>
      api.accounts.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] })
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update account'),
  })

  function moveAccount(idx: number, direction: -1 | 1) {
    if (!accounts) return
    const otherIdx = idx + direction
    if (otherIdx < 0 || otherIdx >= accounts.length) return
    updateAccountMutation.mutate({ id: accounts[idx].id, data: { sortOrder: otherIdx } })
    updateAccountMutation.mutate({ id: accounts[otherIdx].id, data: { sortOrder: idx } })
  }

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => api.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
      toast.success('Category deleted')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete category'),
  })

  const exportMutation = useMutation({
    mutationFn: () => api.users.exportData(),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fast-finance-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Data exported')
    },
    onError: (err: Error) => toast.error(err.message || 'Export failed'),
  })

  const deleteUserMutation = useMutation({
    mutationFn: () => api.users.deleteAccount(),
    onSuccess: () => {
      toast.success('Account deleted')
      logout()
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete account'),
  })

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.auth.getSessions(),
    enabled: !!token,
  })

  const revokeSessionMutation = useMutation({
    mutationFn: (id: string) => api.auth.revokeSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Сессия завершена')
    },
    onError: (err: Error) => toast.error(err.message || 'Не удалось завершить сессию'),
  })

  const { data: myOrg, isLoading: orgLoading, refetch: refetchOrg } = useQuery({
    queryKey: ['myOrg', userId],
    queryFn: () => api.orgs.getMyOrg(),
    retry: false,
    enabled: !!token,
  })

  const { data: orgMembersData, refetch: refetchMembers } = useQuery({
    queryKey: ['orgMembers', myOrg?.orgId],
    queryFn: () => api.orgs.getMembers(myOrg!.orgId),
    enabled: !!myOrg?.orgId,
  })

  const createOrgMutation = useMutation({
    mutationFn: (name: string) => api.orgs.create(name),
    onSuccess: () => {
      refetchOrg()
      setOrgView('none')
      setOrgNewName('')
      toast.success('Group created')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create group'),
  })

  const joinOrgMutation = useMutation({
    mutationFn: (code: string) => api.orgs.join(code),
    onSuccess: () => {
      refetchOrg()
      setOrgView('none')
      setOrgInviteInput('')
      toast.success('Joined group')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to join group'),
  })

  const leaveOrgMutation = useMutation({
    mutationFn: () => api.orgs.leave(),
    onSuccess: () => {
      refetchOrg()
      setConfirmLeave(false)
      toast.success('Left group')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to leave group'),
  })

  const removeOrgMemberMutation = useMutation({
    mutationFn: ({ orgId, memberId }: { orgId: number; memberId: number }) =>
      api.orgs.removeMember(orgId, memberId),
    onSuccess: () => {
      refetchMembers()
      toast.success('Member removed')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to remove member'),
  })

  const userCategories = categories?.filter(c => c.userId !== null) || []
  const expenseCategories = userCategories.filter(c => c.type === 'expense')
  const incomeCategories = userCategories.filter(c => c.type === 'income')

  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Accounts Section */}
      <motion.div
        className="glass-card"
        style={{ padding: '1.25rem' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={18} className="text-primary" />
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}>
              {t('accounts')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddAccountOpen(true)}
            className="gap-1 text-primary bg-[var(--accent-dim)] border border-[var(--accent-glow)]"
          >
            <Plus size={16} />
            {t('add')}
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {accountsLoading && [...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-[var(--radius-xs)]" />
          ))}
          {accounts?.map((account, idx) => (
            <motion.div
              key={account.id}
              className="glass-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.875rem',
                borderRadius: '0.75rem',
              }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{account.type === 'savings' ? '🐷' : '🏦'}</span>
                <div>
                  <p style={{ fontWeight: 500, color: 'var(--text)', fontSize: '0.9375rem' }}>
                    {account.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                    {CURRENCY_LABELS[account.currency]} • {formatCurrency(account.balance, account.currency)}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <motion.button
                  onClick={() => moveAccount(idx, -1)}
                  disabled={idx === 0}
                  style={{
                    padding: '0.375rem',
                    background: 'none',
                    border: 'none',
                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                    color: 'var(--text-muted)',
                    opacity: idx === 0 ? 0.2 : 0.5,
                    transition: 'opacity 150ms ease',
                    WebkitAppearance: 'none',
                  }}
                  whileHover={{ opacity: idx === 0 ? 0.2 : 1 }}
                  whileTap={{ scale: idx === 0 ? 1 : 0.85 }}
                >
                  <ArrowUp size={16} />
                </motion.button>
                <motion.button
                  onClick={() => moveAccount(idx, 1)}
                  disabled={idx === (accounts?.length ?? 0) - 1}
                  style={{
                    padding: '0.375rem',
                    background: 'none',
                    border: 'none',
                    cursor: idx === (accounts?.length ?? 0) - 1 ? 'not-allowed' : 'pointer',
                    color: 'var(--text-muted)',
                    opacity: idx === (accounts?.length ?? 0) - 1 ? 0.2 : 0.5,
                    transition: 'opacity 150ms ease',
                    WebkitAppearance: 'none',
                  }}
                  whileHover={{ opacity: idx === (accounts?.length ?? 0) - 1 ? 0.2 : 1 }}
                  whileTap={{ scale: idx === (accounts?.length ?? 0) - 1 ? 1 : 0.85 }}
                >
                  <ArrowDown size={16} />
                </motion.button>
                <motion.button
                  onClick={() => deleteAccountMutation.mutate(account.id)}
                  style={{
                    padding: '0.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    opacity: 0.5,
                    transition: 'opacity 150ms ease',
                    WebkitAppearance: 'none',
                  }}
                  whileHover={{ opacity: 1 }}
                  whileTap={{ scale: 0.85 }}
                >
                  <Trash2 size={18} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Categories Section */}
      <motion.div
        className="glass-card"
        style={{ padding: '1.25rem' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Grid3x3 size={18} className="text-primary" />
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}>
              {t('categories')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddCategoryModalOpen(true)}
            className="gap-1 text-primary bg-[var(--accent-dim)] border border-[var(--accent-glow)]"
          >
            <Plus size={16} />
            {t('add')}
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {categoriesLoading && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-lg" />
              ))}
            </div>
          )}
          {/* Expense Categories */}
          {!categoriesLoading && <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {t('expenses')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {expenseCategories.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                  {t('noCategories')}
                </p>
              )}
              {expenseCategories.map((cat, idx) => (
                <motion.div
                  key={cat.id}
                  className="group"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.375rem 0.5rem 0.375rem 0.625rem',
                    background: 'var(--bg-elevated)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + idx * 0.03 }}
                >
                  <span style={{ fontSize: '1rem' }}>{getCategoryIcon(cat.icon)}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{cat.name}</span>
                  <div style={{ display: 'flex', gap: '0.125rem', marginLeft: '0.25rem', opacity: 1, transition: 'opacity 150ms' }} className="group-hover:opacity-100">
                    <motion.button
                      onClick={() => setEditingCategory(cat)}
                      style={{
                        padding: '0.25rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        borderRadius: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Pencil size={14} />
                    </motion.button>
                    <motion.button
                      onClick={() => deleteCategoryMutation.mutate(cat.id)}
                      style={{
                        padding: '0.25rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--red)',
                        borderRadius: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>}

          {/* Income Categories */}
          {!categoriesLoading && <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {t('income')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {incomeCategories.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                  {t('noCategories')}
                </p>
              )}
              {incomeCategories.map((cat, idx) => (
                <motion.div
                  key={cat.id}
                  className="group"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.375rem 0.5rem 0.375rem 0.625rem',
                    background: 'var(--bg-elevated)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + idx * 0.03 }}
                >
                  <span style={{ fontSize: '1rem' }}>{getCategoryIcon(cat.icon)}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{cat.name}</span>
                  <div style={{ display: 'flex', gap: '0.125rem', marginLeft: '0.25rem', opacity: 1, transition: 'opacity 150ms' }} className="group-hover:opacity-100">
                    <motion.button
                      onClick={() => setEditingCategory(cat)}
                      style={{
                        padding: '0.25rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        borderRadius: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Pencil size={14} />
                    </motion.button>
                    <motion.button
                      onClick={() => deleteCategoryMutation.mutate(cat.id)}
                      style={{
                        padding: '0.25rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--red)',
                        borderRadius: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>}
        </div>
      </motion.div>

      {/* Data & Privacy Section */}
      <motion.div
        className="glass-card"
        style={{ padding: '1.25rem' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <ShieldAlert size={18} className="text-primary" />
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}>
            {t('gdpr')}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="w-full justify-start gap-2 text-left"
          >
            <Download size={16} />
            {exportMutation.isPending ? '...' : t('exportData')}
          </Button>

          {!confirmDelete ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="w-full justify-start gap-2 text-[var(--expense)]"
            >
              <Trash2 size={16} />
              {t('deleteAccount')}
            </Button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--expense)', padding: '0.25rem 0' }}>
                {t('deleteConfirm')}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1"
                >
                  {tTx('cancel')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteUserMutation.mutate()}
                  disabled={deleteUserMutation.isPending}
                  className="flex-1 text-[var(--expense)] border border-[var(--expense)]"
                >
                  {deleteUserMutation.isPending ? '...' : t('deleteAccount')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Sessions Section */}
      <motion.div
        className="glass-card"
        style={{ padding: '1.25rem' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Shield size={18} className="text-primary" />
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}>
            {t('sessions')}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sessionsLoading && [...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-[var(--radius-xs)]" />
          ))}
          {sessions?.map((session) => {
            const isCurrent = session.id === currentSessionId
            const created = new Date(session.createdAt).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
            const expires = new Date(session.expiresAt).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
            return (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.625rem',
                  background: 'var(--glass-bg)',
                  border: isCurrent ? '1px solid var(--accent-glow)' : '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text)' }}>
                      {created}
                    </span>
                    {isCurrent && (
                      <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: 'var(--primary)',
                        background: 'var(--accent-dim)',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '0.25rem',
                      }}>
                        {t('current')}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {t('expires')} {expires}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeSessionMutation.mutate(session.id)}
                  disabled={isCurrent || revokeSessionMutation.isPending}
                  className="text-[var(--expense)] h-8 px-2"
                >
                  <X size={14} />
                </Button>
              </div>
            )
          })}
          {!sessionsLoading && sessions?.length === 0 && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
              {t('noSessions')}
            </p>
          )}
        </div>
      </motion.div>

      {/* Language Section */}
      <motion.div
        className="glass-card"
        style={{ padding: '1.25rem' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.125rem' }}>🌐</span>
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}>
            {t('language')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {SUPPORTED_LOCALES.map((loc) => (
            <motion.button
              key={loc}
              onClick={() => setLocale(loc)}
              style={{
                padding: '0.5rem 0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid',
                borderColor: currentLocale === loc ? 'var(--accent)' : 'var(--border)',
                backgroundColor: currentLocale === loc ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                color: currentLocale === loc ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                WebkitAppearance: 'none',
              }}
              whileTap={{ scale: 0.95 }}
            >
              {LOCALE_LABELS[loc]}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Org / Family Section */}
      <motion.div
        className="glass-card"
        style={{ padding: '1.25rem' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Users size={18} className="text-primary" />
          <div>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}>{tOrg('title')}</span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{tOrg('hint')}</p>
          </div>
        </div>

        {orgLoading && <Skeleton className="h-10 rounded-[var(--radius-xs)]" />}

        {!orgLoading && !myOrg && orgView === 'none' && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setOrgView('create')}>
              {tOrg('create')}
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setOrgView('join')}>
              {tOrg('join')}
            </Button>
          </div>
        )}

        {!orgLoading && !myOrg && orgView === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <Input
              value={orgNewName}
              onChange={(e) => setOrgNewName(e.target.value)}
              placeholder={tOrg('namePlaceholder')}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                disabled={!orgNewName.trim() || createOrgMutation.isPending}
                onClick={() => createOrgMutation.mutate(orgNewName.trim())}
              >
                {createOrgMutation.isPending ? tOrg('creating') : tOrg('create')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setOrgView('none')}>
                <X size={14} />
              </Button>
            </div>
          </div>
        )}

        {!orgLoading && !myOrg && orgView === 'join' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <Input
              value={orgInviteInput}
              onChange={(e) => setOrgInviteInput(e.target.value.toUpperCase())}
              placeholder={tOrg('inviteCodePlaceholder')}
              maxLength={6}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                disabled={orgInviteInput.length < 6 || joinOrgMutation.isPending}
                onClick={() => joinOrgMutation.mutate(orgInviteInput)}
              >
                {joinOrgMutation.isPending ? tOrg('joining') : tOrg('join')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setOrgView('none')}>
                <X size={14} />
              </Button>
            </div>
          </div>
        )}

        {!orgLoading && myOrg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.625rem 0.75rem',
              borderRadius: '0.625rem',
              background: 'var(--glass-bg)',
              border: '1px solid var(--border)',
            }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{myOrg.orgName}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  {tOrg('inviteCode')}: <span style={{ fontWeight: 600, letterSpacing: '0.1em' }}>{myOrg.inviteCode}</span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(myOrg.inviteCode)
                  toast.success(tOrg('codeCopied'))
                }}
              >
                <Copy size={14} />
              </Button>
            </div>

            {orgMembersData && orgMembersData.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{tOrg('members')}</p>
                {orgMembersData.map((m) => (
                  <div key={m.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.375rem 0.625rem',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-elevated)',
                  }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text)' }}>
                      user #{m.userId}
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '0.375rem' }}>
                        {tOrg(m.role as 'owner' | 'member')}
                      </span>
                    </span>
                    {myOrg.role === 'owner' && m.userId !== userId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[var(--expense)] h-6 px-1.5"
                        onClick={() => removeOrgMemberMutation.mutate({ orgId: myOrg.orgId, memberId: m.userId })}
                      >
                        <X size={12} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {myOrg.role === 'member' && (
              confirmLeave ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => leaveOrgMutation.mutate()}
                    disabled={leaveOrgMutation.isPending}
                  >
                    <LogOut size={14} />
                    {tOrg('leaveConfirm')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmLeave(false)}><X size={14} /></Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setConfirmLeave(true)} className="gap-1 text-muted-foreground">
                  <LogOut size={14} />
                  {tOrg('leave')}
                </Button>
              )
            )}
          </div>
        )}
      </motion.div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', paddingBottom: '0.5rem' }}>
        <a
          href="/terms"
          style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}
        >
          Условия использования
        </a>
        <a
          href="/privacy"
          style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}
        >
          Политика конфиденциальности
        </a>
      </div>

      {/* Add Account Modal */}
      <AnimatePresence>
        {isAddAccountOpen && (
          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'flex-end',
              zIndex: 1000,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAddAccountOpen(false)}
          >
            <motion.div
              style={{
                width: '100%',
                backgroundColor: 'var(--bg)',
                borderTopLeftRadius: '1.5rem',
                borderTopRightRadius: '1.5rem',
                padding: '1.5rem',
                paddingBottom: 'calc(1.5rem + var(--tg-safe-area-inset-bottom, 0px))',
                overflowY: 'auto',
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
                  {t('add')} {t('accounts').toLowerCase()}
                </h2>
                <button
                  onClick={() => setIsAddAccountOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    WebkitAppearance: 'none',
                  }}
                >
                  <X size={24} className="text-[var(--text-secondary)]" />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <Label className="block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
                    {t('accounts')}
                  </Label>
                  <Input
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder={t('accounts')}
                  />
                </div>

                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <Label className="block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
                    {tWiz('currencyLabel')}
                  </Label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {CURRENCIES.map((curr) => (
                      <motion.button
                        key={curr}
                        onClick={() => setNewAccountCurrency(curr)}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          border: '1px solid',
                          borderColor: newAccountCurrency === curr ? 'var(--accent)' : 'var(--border)',
                          backgroundColor: newAccountCurrency === curr ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                          color: newAccountCurrency === curr ? 'var(--accent)' : 'var(--text-secondary)',
                          fontWeight: 500,
                          fontSize: '0.9375rem',
                          cursor: 'pointer',
                          WebkitAppearance: 'none',
                        }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {CURRENCY_LABELS[curr]} {curr}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <Label className="block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
                    {t('accountType')}
                  </Label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {([['checking', '🏦', t('checking')], ['savings', '🐷', t('savings')]] as const).map(([type, icon, label]) => (
                      <motion.button
                        key={type}
                        onClick={() => setNewAccountType(type)}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          border: '1px solid',
                          borderColor: newAccountType === type ? 'var(--accent)' : 'var(--border)',
                          backgroundColor: newAccountType === type ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                          color: newAccountType === type ? 'var(--accent)' : 'var(--text-secondary)',
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          WebkitAppearance: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.375rem',
                        }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <span>{icon}</span>
                        <span>{label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <MotionButton
                  onClick={() => createAccountMutation.mutate({ name: newAccountName, currency: newAccountCurrency, type: newAccountType })}
                  disabled={!newAccountName.trim() || createAccountMutation.isPending}
                  variant="default"
                  size="lg"
                  className="w-full"
                  whileTap={{ scale: newAccountName.trim() && !createAccountMutation.isPending ? 0.97 : 1 }}
                >
                  {createAccountMutation.isPending ? '...' : tWiz('create')}
                </MotionButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Category Modal */}
      <AnimatePresence>
        {isAddCategoryModalOpen && (
          <AddCategoryModal
            userId={userId}
            onClose={() => setAddCategoryModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Edit Category Modal */}
      <AnimatePresence>
        {editingCategory && (
          <EditCategoryModal
            userId={userId}
            category={editingCategory}
            onClose={() => setEditingCategory(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function AddCategoryModal({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { token } = useAuthStore()
  const api = createApiClient(token || '')
  const queryClient = useQueryClient()
  const { transactionType, setTransactionType } = useFinanceStore()
  const t = useTranslations('settings')
  const tDash = useTranslations('dashboard')

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📁')

  const createMutation = useMutation({
    mutationFn: (data: { name: string; icon: string; type: string }) =>
      api.categories.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
      toast.success('Category created')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create category'),
  })

  return (
    <motion.div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 1000,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={{
          width: '100%',
          backgroundColor: 'var(--bg)',
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
          padding: '1.5rem',
          paddingBottom: 'calc(1.5rem + var(--tg-safe-area-inset-bottom, 0px))',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
            {t('addCategory')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              WebkitAppearance: 'none',
            }}
          >
            <X size={24} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Type selector */}
          <div className="glass-card" style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <motion.button
              onClick={() => setTransactionType('income')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid',
                borderColor: transactionType === 'income' ? 'var(--green)' : 'var(--border)',
                backgroundColor: transactionType === 'income' ? 'var(--green)' + '15' : 'transparent',
                color: transactionType === 'income' ? 'var(--green)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.875rem',
                fontFamily: "'Outfit', sans-serif",
                WebkitAppearance: 'none',
              }}
              whileTap={{ scale: 0.97 }}
            >
              {tDash('income')}
            </motion.button>
            <motion.button
              onClick={() => setTransactionType('expense')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid',
                borderColor: transactionType === 'expense' ? 'var(--red)' : 'var(--border)',
                backgroundColor: transactionType === 'expense' ? 'var(--red)' + '15' : 'transparent',
                color: transactionType === 'expense' ? 'var(--red)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.875rem',
                fontFamily: "'Outfit', sans-serif",
                WebkitAppearance: 'none',
              }}
              whileTap={{ scale: 0.97 }}
            >
              {tDash('expense')}
            </motion.button>
          </div>

          {/* Name input */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <Label className="block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
              {t('categoryNameLabel')}
            </Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('categoryNamePlaceholder')}
            />
          </div>

          {/* Icon selector */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <Label className="block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-3">
              {t('icon')}
            </Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.375rem' }}>
              {EMOJI_ICONS.map((emoji) => (
                <motion.button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  style={{
                    padding: '0.5rem',
                    fontSize: '1.25rem',
                    borderRadius: '0.5rem',
                    border: '1px solid',
                    borderColor: icon === emoji ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: icon === emoji ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    cursor: 'pointer',
                    WebkitAppearance: 'none',
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{icon}</span>
            <span style={{ fontSize: '1rem', color: 'var(--text)' }}>{name || t('categoryNameLabel')}</span>
            <span style={{
              fontSize: '0.6875rem',
              color: transactionType === 'income' ? 'var(--green)' : 'var(--red)',
              marginLeft: 'auto',
              padding: '0.25rem 0.5rem',
              background: transactionType === 'income' ? 'var(--green-dim)' : 'var(--red-dim)',
              borderRadius: '0.375rem',
            }}>
              {transactionType === 'income' ? tDash('income') : tDash('expense')}
            </span>
          </div>

          <MotionButton
            onClick={() => createMutation.mutate({ name, icon, type: transactionType })}
            disabled={!name.trim() || createMutation.isPending}
            variant="default"
            size="lg"
            className="w-full"
            style={{ backgroundColor: transactionType === 'income' ? 'var(--green)' : 'var(--red)' }}
            whileTap={{ scale: name.trim() && !createMutation.isPending ? 0.97 : 1 }}
          >
            {createMutation.isPending ? '...' : t('addCategory')}
          </MotionButton>
        </div>
      </motion.div>
    </motion.div>
  )
}

function EditCategoryModal({ userId, category, onClose }: { userId: number; category: Category; onClose: () => void }) {
  const { token } = useAuthStore()
  const api = createApiClient(token || '')
  const queryClient = useQueryClient()
  const t = useTranslations('settings')
  const tDash = useTranslations('dashboard')

  const [name, setName] = useState(category.name)
  const [icon, setIcon] = useState(category.icon)
  const [type, setType] = useState(category.type)

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; icon: string; type: string }) =>
      api.categories.update(category.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
      toast.success('Category updated')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update category'),
  })

  return (
    <motion.div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 1000,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={{
          width: '100%',
          backgroundColor: 'var(--bg)',
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
          padding: '1.5rem',
          paddingBottom: 'calc(1.5rem + var(--tg-safe-area-inset-bottom, 0px))',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
            {t('editCategory')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              WebkitAppearance: 'none',
            }}
          >
            <X size={24} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Type selector */}
          <div className="glass-card" style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <motion.button
              onClick={() => setType('income')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid',
                borderColor: type === 'income' ? 'var(--green)' : 'var(--border)',
                backgroundColor: type === 'income' ? 'var(--green)' + '15' : 'transparent',
                color: type === 'income' ? 'var(--green)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.875rem',
                fontFamily: "'Outfit', sans-serif",
                WebkitAppearance: 'none',
              }}
              whileTap={{ scale: 0.97 }}
            >
              {tDash('income')}
            </motion.button>
            <motion.button
              onClick={() => setType('expense')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid',
                borderColor: type === 'expense' ? 'var(--red)' : 'var(--border)',
                backgroundColor: type === 'expense' ? 'var(--red)' + '15' : 'transparent',
                color: type === 'expense' ? 'var(--red)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.875rem',
                fontFamily: "'Outfit', sans-serif",
                WebkitAppearance: 'none',
              }}
              whileTap={{ scale: 0.97 }}
            >
              {tDash('expense')}
            </motion.button>
          </div>

          {/* Name input */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <Label className="block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
              {t('categoryNameLabel')}
            </Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('categoryNamePlaceholder')}
            />
          </div>

          {/* Icon selector */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <Label className="block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-3">
              {t('icon')}
            </Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.375rem' }}>
              {EMOJI_ICONS.map((emoji) => (
                <motion.button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  style={{
                    padding: '0.5rem',
                    fontSize: '1.25rem',
                    borderRadius: '0.5rem',
                    border: '1px solid',
                    borderColor: icon === emoji ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: icon === emoji ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    cursor: 'pointer',
                    WebkitAppearance: 'none',
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{icon}</span>
            <span style={{ fontSize: '1rem', color: 'var(--text)' }}>{name || t('categoryNameLabel')}</span>
            <span style={{
              fontSize: '0.6875rem',
              color: type === 'income' ? 'var(--green)' : 'var(--red)',
              marginLeft: 'auto',
              padding: '0.25rem 0.5rem',
              background: type === 'income' ? 'var(--green-dim)' : 'var(--red-dim)',
              borderRadius: '0.375rem',
            }}>
              {type === 'income' ? tDash('income') : tDash('expense')}
            </span>
          </div>

          <MotionButton
            onClick={() => updateMutation.mutate({ name, icon, type })}
            disabled={!name.trim() || updateMutation.isPending}
            variant="default"
            size="lg"
            className="w-full"
            style={{ backgroundColor: type === 'income' ? 'var(--green)' : 'var(--red)' }}
            whileTap={{ scale: name.trim() && !updateMutation.isPending ? 0.97 : 1 }}
          >
            {updateMutation.isPending ? '...' : t('saveCategory')}
          </MotionButton>
        </div>
      </motion.div>
    </motion.div>
  )
}