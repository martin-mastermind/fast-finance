'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { MdAdd, MdDelete, MdClose, MdAccountBalance, MdCategory, MdEdit } from 'react-icons/md'
import { useFinanceStore } from '@/store/finance'

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
  const api = createApiClient(userId)
  const queryClient = useQueryClient()
  const { transactionType, setTransactionType, isAddCategoryModalOpen, setAddCategoryModalOpen } = useFinanceStore()

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountCurrency, setNewAccountCurrency] = useState('RUB')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const { data: accounts } = useQuery({
    queryKey: ['accounts', userId],
    queryFn: () => api.accounts.list(),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories', userId],
    queryFn: () => api.categories.list(),
  })

  const createAccountMutation = useMutation({
    mutationFn: (data: { name: string; currency: string }) =>
      api.accounts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] })
      setIsAddAccountOpen(false)
      setNewAccountName('')
      setNewAccountCurrency('RUB')
    },
  })

  const deleteAccountMutation = useMutation({
    mutationFn: (id: number) => api.accounts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] })
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => api.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
    },
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
            <MdAccountBalance size={18} color="var(--accent)" />
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}>
              Счета
            </span>
          </div>
          <button
            onClick={() => setIsAddAccountOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.375rem 0.75rem',
              background: 'var(--accent-dim)',
              borderRadius: '0.5rem',
              border: '1px solid var(--accent-glow)',
              color: 'var(--accent)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              WebkitAppearance: 'none',
            }}
          >
            <MdAdd size={16} />
            Добавить
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
              <div>
                <p style={{ fontWeight: 500, color: 'var(--text)', fontSize: '0.9375rem' }}>
                  {account.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                  {CURRENCY_LABELS[account.currency]} • {formatCurrency(account.balance, account.currency)}
                </p>
              </div>
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
                <MdDelete size={18} />
              </motion.button>
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
            <MdCategory size={18} color="var(--accent)" />
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}>
              Категории
            </span>
          </div>
          <button
            onClick={() => setAddCategoryModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.375rem 0.75rem',
              background: 'var(--accent-dim)',
              borderRadius: '0.5rem',
              border: '1px solid var(--accent-glow)',
              color: 'var(--accent)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              WebkitAppearance: 'none',
            }}
          >
            <MdAdd size={16} />
            Добавить
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Expense Categories */}
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Расходы
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {expenseCategories.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                  Нет категорий
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
                  <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{cat.name}</span>
                  <div style={{ display: 'flex', gap: '0.125rem', marginLeft: '0.25rem', opacity: 0, transition: 'opacity 150ms' }} className="group-hover:opacity-100">
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
                      <MdEdit size={14} />
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
                      <MdDelete size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Income Categories */}
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Доходы
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {incomeCategories.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                  Нет категорий
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
                  <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{cat.name}</span>
                  <div style={{ display: 'flex', gap: '0.125rem', marginLeft: '0.25rem', opacity: 0, transition: 'opacity 150ms' }} className="group-hover:opacity-100">
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
                      <MdEdit size={14} />
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
                      <MdDelete size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

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
                  Новый счёт
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
                  <MdClose size={24} color="var(--text-secondary)" />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <label className="text-hint" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
                    Название счёта
                  </label>
                  <input
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="Например: Наличка"
                    className="input-field"
                  />
                </div>

                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <label className="text-hint" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
                    Валюта
                  </label>
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

                <motion.button
                  onClick={() => createAccountMutation.mutate({ name: newAccountName, currency: newAccountCurrency })}
                  disabled={!newAccountName.trim() || createAccountMutation.isPending}
                  className="btn-primary"
                  whileTap={{ scale: newAccountName.trim() && !createAccountMutation.isPending ? 0.97 : 1 }}
                >
                  {createAccountMutation.isPending ? 'Создание...' : 'Создать счёт'}
                </motion.button>
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
  const api = createApiClient(userId)
  const queryClient = useQueryClient()
  const { transactionType, setTransactionType } = useFinanceStore()

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📁')

  const createMutation = useMutation({
    mutationFn: (data: { name: string; icon: string; type: string }) =>
      api.categories.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
      onClose()
    },
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
            Новая категория
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
            <MdClose size={24} color="var(--text-secondary)" />
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
              Доход
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
              Расход
            </motion.button>
          </div>

          {/* Name input */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <label className="text-hint" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
              Название категории
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Продукты"
              className="input-field"
            />
          </div>

          {/* Icon selector */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <label className="text-hint" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
              Иконка
            </label>
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
            <span style={{ fontSize: '1rem', color: 'var(--text)' }}>{name || 'Название'}</span>
            <span style={{
              fontSize: '0.6875rem',
              color: transactionType === 'income' ? 'var(--green)' : 'var(--red)',
              marginLeft: 'auto',
              padding: '0.25rem 0.5rem',
              background: transactionType === 'income' ? 'var(--green-dim)' : 'var(--red-dim)',
              borderRadius: '0.375rem',
            }}>
              {transactionType === 'income' ? 'Доход' : 'Расход'}
            </span>
          </div>

          <motion.button
            onClick={() => createMutation.mutate({ name, icon, type: transactionType })}
            disabled={!name.trim() || createMutation.isPending}
            className="btn-primary"
            style={{
              backgroundColor: transactionType === 'income' ? 'var(--green)' : 'var(--red)',
            }}
            whileTap={{ scale: name.trim() && !createMutation.isPending ? 0.97 : 1 }}
          >
          {createMutation.isPending ? 'Создание...' : 'Создать категорию'}
        </motion.button>
      </div>
    </motion.div>
  )
}

function EditCategoryModal({ userId, category, onClose }: { userId: number; category: Category; onClose: () => void }) {
  const api = createApiClient(userId)
  const queryClient = useQueryClient()

  const [name, setName] = useState(category.name)
  const [icon, setIcon] = useState(category.icon)
  const [type, setType] = useState(category.type)

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; icon: string; type: string }) =>
      api.categories.update(category.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
      onClose()
    },
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
            Редактировать категорию
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
            <MdClose size={24} color="var(--text-secondary)" />
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
              Доход
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
              Расход
            </motion.button>
          </div>

          {/* Name input */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <label className="text-hint" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
              Название категории
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Продукты"
              className="input-field"
            />
          </div>

          {/* Icon selector */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <label className="text-hint" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
              Иконка
            </label>
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
            <span style={{ fontSize: '1rem', color: 'var(--text)' }}>{name || 'Название'}</span>
            <span style={{
              fontSize: '0.6875rem',
              color: type === 'income' ? 'var(--green)' : 'var(--red)',
              marginLeft: 'auto',
              padding: '0.25rem 0.5rem',
              background: type === 'income' ? 'var(--green-dim)' : 'var(--red-dim)',
              borderRadius: '0.375rem',
            }}>
              {type === 'income' ? 'Доход' : 'Расход'}
            </span>
          </div>

          <motion.button
            onClick={() => updateMutation.mutate({ name, icon, type })}
            disabled={!name.trim() || updateMutation.isPending}
            className="btn-primary"
            style={{
              backgroundColor: type === 'income' ? 'var(--green)' : 'var(--red)',
            }}
            whileTap={{ scale: name.trim() && !updateMutation.isPending ? 0.97 : 1 }}
          >
            {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}