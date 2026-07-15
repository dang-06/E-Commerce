import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'
import { User } from '@/lib/types'

interface AdminLayoutProps {
  children: React.ReactNode
  user?: User | null
}

export function AdminLayout({ children, user }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader user={user} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
