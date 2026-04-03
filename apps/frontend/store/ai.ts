import { create } from 'zustand'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AiStore {
  messages: ChatMessage[]
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  clearMessages: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useAiStore = create<AiStore>((set) => ({
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}))
