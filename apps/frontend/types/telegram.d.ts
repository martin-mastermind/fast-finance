interface TelegramWebApp {
  initData: string
  initDataUnsafe: Record<string, unknown>
  ready: () => void
  expand: () => void
  close: () => void
  HapticFeedback: {
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    selectionChanged: () => void
  }
  colorScheme: 'light' | 'dark'
  themeParams: Record<string, string>
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp
  }
}
