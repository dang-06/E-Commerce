'use client'

import { Bell, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { User as UserType } from '@/lib/types'
import { getStoredAuth } from '@/lib/services/auth'

interface AdminHeaderProps {
  user?: UserType | null
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const [mounted, setMounted] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)

  useEffect(() => {
    setMounted(true)
    if (user) {
      setCurrentUser(user)
    } else {
      setCurrentUser(getStoredAuth()?.user ?? null)
    }
  }, [user])

  if (!mounted) return null

  return (
    <header className="border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>

          <Button variant="ghost" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
              <span className="text-sm font-semibold text-primary">
                {currentUser?.name.charAt(0) ?? 'U'}
              </span>
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-foreground">{currentUser?.name ?? 'User'}</p>
              <p className="text-xs text-muted-foreground">
                {currentUser?.role === 'admin' ? 'Quản lý' : 'Nhân viên'}
              </p>
            </div>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              localStorage.removeItem('auth_context')
              window.location.href = '/admin/login'
            }}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
