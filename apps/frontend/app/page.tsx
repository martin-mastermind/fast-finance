'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { Dashboard } from '@/components/dashboard'
import { AuthScreen } from '@/components/auth-screen'
import { LoadingScreen } from '@/components/loading-screen'
import { SetupWizard } from '@/components/setup-wizard'
import { createApiClient } from '@/lib/api'

export default function HomePage() {
  const { user, isLoading, error, initAuth } = useAuthStore()

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: () => createApiClient(user!.id).accounts.list(),
    enabled: !!user,
  })

  useEffect(() => {
    initAuth()
  }, [initAuth])

  if (isLoading) return <LoadingScreen />
  if (error) return <AuthScreen error={error} />
  if (!user) return <AuthScreen />
  if (accountsLoading) return <LoadingScreen />
  if (!accounts || accounts.length === 0) return <SetupWizard userId={user.id} />
  return <Dashboard />
}
