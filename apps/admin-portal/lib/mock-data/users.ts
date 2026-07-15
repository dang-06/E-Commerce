import { User } from '@/lib/types'

export const mockUsers: User[] = [
  {
    id: 'user_admin',
    email: 'admin@store.com',
    name: 'Quản lý cửa hàng',
    role: 'admin',
    avatar: '👨‍💼',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'user_operator',
    email: 'operator@store.com',
    name: 'Nhân viên kinh doanh',
    role: 'operator',
    avatar: '👩‍💼',
    createdAt: new Date('2024-02-15'),
  },
]

export const mockAuthTokens: Record<string, string> = {
  'admin@store.com': 'token_admin_demo',
  'operator@store.com': 'token_operator_demo',
}
