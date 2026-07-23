'use client'

import Link from 'next/link'
import { Bell, LogOut, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { User as UserType } from '@/lib/types'
import { getStoredAuth, logout } from '@/lib/services/auth'

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
    <header className="border-b border-border bg-card/95 backdrop-blur">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground">
        Bỏ qua tới nội dung
      </a>
      <div className="flex h-14 items-center justify-between gap-4 px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted-foreground">
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="hidden h-9 w-64 items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground lg:flex"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>Tìm sản phẩm, đơn hàng…</span>
          </Link>

          <Link
            href="/admin/logs"
            className="relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-ring"
            aria-label="Xem nhật ký hoạt động"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-foreground"></span>
          </Link>

          <div className="flex items-center gap-2">
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
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Đăng xuất"
            onClick={() => {
              logout()
              window.location.href = '/login'
            }}
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  )
}
