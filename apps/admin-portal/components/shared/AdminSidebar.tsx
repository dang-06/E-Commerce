'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isAdminNavItemActive } from '@/lib/navigation/admin-sidebar'
import { logout } from '@/lib/services/auth'

const navItems = [
  { label: 'Tổng quan', href: '/admin', icon: LayoutDashboard },
  { label: 'Sản phẩm', href: '/admin/products', icon: Package },
  { label: 'Khách ưu đãi', href: '/admin/customers', icon: Users },
  { label: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Báo cáo', href: '/admin/reports', icon: BarChart3 },
  { label: 'Cấu hình', href: '/admin/settings', icon: Settings },
  { label: 'Nhật ký', href: '/admin/logs', icon: Activity },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      <div className="border-b border-sidebar-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground" translate="no">
            RP
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-sidebar-foreground">Admin Portal</h1>
            <p className="text-xs text-muted-foreground">Rosa Perfume</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Điều hướng quản trị">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = isAdminNavItemActive(pathname, item.href)
          return (
            <Link key={item.href} href={item.href}>
              <Button
                aria-current={isActive ? 'page' : undefined}
                variant="ghost"
                className={`h-9 w-full justify-start rounded-md px-3 text-sm ${
                  isActive
                    ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          className="h-9 w-full justify-start rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          onClick={() => {
            logout()
            window.location.href = '/login'
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </aside>
  )
}
