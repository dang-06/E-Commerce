'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { User } from '@/lib/types'
import { validateToken, getStoredAuth } from '@/lib/services/auth'

interface AdminLayoutWrapperProps {
  children: ReactNode
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const auth = getStoredAuth()

      if (!auth || !auth.token) {
        router.push('/login')
        return
      }

      try {
        const validatedUser = await validateToken(auth.token)
        if (validatedUser) {
          setUser(validatedUser)
        } else {
          router.push('/login')
        }
      } catch (e) {
        console.error('Auth validation failed:', e)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  return <AdminLayout user={user}>{children}</AdminLayout>
}
