'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { Dashboard } from '@/components/dashboard'
import { AuthScreen } from '@/components/auth-screen'
import { LoadingScreen } from '@/components/loading-screen'

export default function HomePage() {
  const { user, isLoading, error, initAuth } = useAuthStore()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  if (isLoading) return <LoadingScreen />
  if (error) return <AuthScreen error={error} />
  if (!user) return <AuthScreen />
  return <Dashboard />
}
