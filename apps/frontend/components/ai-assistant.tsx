'use client'

import { useState, useRef, useEffect, type ReactElement } from 'react'
import { useAuthStore } from '@/store/auth'
import { useAiStore, type ChatMessage } from '@/store/ai'
import { createApiClient } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Trash2, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { useFinanceStore } from '@/store/finance'

function renderMarkdown(text: string): ReactElement[] {
  const lines = text.split('\n')
  const result: ReactElement[] = []
  let key = 0

  for (const line of lines) {
    if (line.trim() === '') {
      result.push(<br key={key++} />)
      continue
    }

    // Bullet list
    const isBullet = /^[\-•]\s/.test(line.trim())
    const content = isBullet ? line.trim().replace(/^[\-•]\s/, '') : line

    // Process bold (**text**)
    const parts = content.split(/(\*\*[^*]+\*\*)/)
    const rendered = parts.map((part, i) => {
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      return part
    })

    if (isBullet) {
      result.push(
        <div key={key++} style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem' }}>
          <span style={{ flexShrink: 0, marginTop: '0.1rem' }}>•</span>
          <span>{rendered}</span>
        </div>
      )
    } else {
      result.push(<div key={key++}>{rendered}</div>)
    }
  }

  return result
}

export function AiAssistant() {
  const { user, token } = useAuthStore()
  const { messages, setMessages, addMessage, clearMessages, isLoading, setIsLoading } = useAiStore()
  const { setPlanLimitModalOpen } = useFinanceStore()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const api = createApiClient(token || '')
  const t = useTranslations('ai')

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadHistory() {
    try {
      const { messages: history } = await api.ai.getHistory()
      setMessages(history)
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  async function handleSend() {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    addMessage({ role: 'user', content: userMessage })
    setIsLoading(true)

    try {
      const { response } = await api.ai.chat(userMessage)
      addMessage({ role: 'assistant', content: response })
    } catch (error) {
      console.error('Chat error:', error)
      if (error instanceof Error && error.message.includes('Plan limit reached')) {
        setPlanLimitModalOpen(true)
      } else {
        addMessage({ role: 'assistant', content: t('error') })
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleClear() {
    try {
      await api.ai.clearHistory()
      clearMessages()
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickQuestions = [t('q1'), t('q2'), t('q3'), t('q4')]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent) 0%, #9333ea 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              {t('title')}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Groq Llama 3.1 8B
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="gap-1 text-muted-foreground"
          >
            <Trash2 size={14} />
            {t('clear')}
          </Button>
        )}
      </div>

      {/* Quick Questions */}
      {messages.length === 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            {t('quickQuestions')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {quickQuestions.map((q) => (
              <Button
                key={q}
                variant="outline"
                className="rounded-full h-7 text-[0.6875rem] px-2.5 bg-[var(--glass-bg)] text-foreground"
                onClick={() => setInput(q)}
              >
                {q}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div 
        className="no-scrollbar"
        style={{ 
          flex: 1, 
          overflowY: 'auto',
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                maxWidth: '85%',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: msg.role === 'user'
                    ? '1rem 1rem 0.25rem 1rem'
                    : '1rem 1rem 1rem 0.25rem',
                  background: msg.role === 'user'
                    ? 'var(--accent)'
                    : 'var(--bg-elevated)',
                  color: msg.role === 'user' ? 'white' : 'var(--text)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                }}
              >
                {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              maxWidth: '85%',
              alignSelf: 'flex-start',
            }}
          >
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '1rem 1rem 1rem 0.25rem',
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
              }}
            >
              {t('thinking')}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0.75rem',
        background: 'var(--bg-elevated)',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t('placeholder')}
          disabled={isLoading}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: '0.9375rem',
            color: 'var(--text)',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: input.trim() && !isLoading ? 'var(--accent)' : 'var(--bg)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: input.trim() && !isLoading ? 'pointer' : 'default',
            opacity: input.trim() && !isLoading ? 1 : 0.5,
            transition: 'opacity 150ms ease',
          }}
        >
          <Send size={18} color={input.trim() && !isLoading ? 'white' : 'var(--text-muted)'} />
        </button>
      </div>
    </div>
  )
}
