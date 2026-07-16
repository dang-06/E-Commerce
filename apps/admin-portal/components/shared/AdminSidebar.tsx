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
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { label: 'Tổng quan', href: '/admin', icon: LayoutDashboard },
  { label: 'Sản phẩm', href: '/admin/products', icon: Package },
  { label: 'Khách ưu đãi', href: '/admin/customers', icon: Users },
  { label: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Báo cáo', href: '/admin/reports', icon: BarChart3 },
  { label: 'Cấu hình', href: '/admin/settings', icon: Settings },
  { label: 'Nhật ký', href: '/admin/logs', icon: Package },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden w-64 border-r border-border bg-sidebar md:flex md:flex-col">
      <div className="border-b border-sidebar-border px-6 py-4">
        <h1 className="text-xl font-bold text-primary">Quản lý Bán hàng</h1>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start ${
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-sidebar-accent'
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
          className="w-full justify-start text-destructive hover:bg-red-50"
          onClick={() => {
            localStorage.removeItem('auth_context')
            window.location.href = '/admin/login'
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </div>
  )
}
