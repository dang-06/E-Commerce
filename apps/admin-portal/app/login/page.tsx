'use client'

import { useState, type SyntheticEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { mockLogin, setStoredAuth } from '@/lib/services/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@store.com')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await mockLogin(email, password)

      if (!result) {
        setError('Email hoặc mật khẩu không chính xác')
        setLoading(false)
        return
      }

      const auth = {
        user: result.user,
        token: result.token,
        role: result.user.role,
      }

      setStoredAuth(auth)
      router.push('/admin')
    } catch (e) {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 to-background px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="space-y-6 p-8">
          {/* Logo & Title */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Quản lý Bán hàng</h1>
            <p className="mt-1 text-sm text-muted-foreground">Cửa hàng Điện tử Online</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Demo Credentials */}
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900 border border-blue-200">
            <p className="font-semibold">Tài khoản Demo:</p>
            <p>Admin: admin@store.com</p>
            <p>Nhân viên: operator@store.com</p>
            <p className="text-xs mt-1">Mật khẩu: bất kỳ</p>
          </div>

          {/* Form */}
          <form
            onSubmit={(event) => {
              void handleSubmit(event)
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@store.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); }}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => { setShowPassword(!showPassword); }}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading} size="lg">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            Đây là hệ thống quản lý nội bộ. Chỉ nhân viên được phép truy cập.
          </p>
        </div>
      </Card>
    </div>
  )
}
