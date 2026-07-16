'use client'

import { User, UserRole } from '@/lib/types'

export interface AuthContext {
  user: User | null
  token: string | null
  role: UserRole | null
}

const AUTH_STORAGE_KEY = 'auth_context'
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1'

interface LoginResponse {
  accessToken: string
  admin: {
    id: string
    email: string
    fullName: string
    role: UserRole
    createdAt: string
  }
}

interface MeResponse {
  id: string
  email: string
  fullName: string
  role: UserRole
  createdAt: string
}

export function getStoredAuth(): AuthContext | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) {
      return null
    }
    const parsed = JSON.parse(stored) as unknown
    if (!isAuthContext(parsed)) {
      return null
    }
    return {
      ...parsed,
      user: parsed.user ? { ...parsed.user, createdAt: new Date(parsed.user.createdAt) } : null,
    }
  } catch {
    return null
  }
}

export function setStoredAuth(auth: AuthContext): void {
  if (typeof window === 'undefined') return

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: User; token: string } | null> {
  const response = await fetch(`${apiBaseUrl}/admin/auth/login`, {
    body: JSON.stringify({ email, password }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })

  if (!response.ok) {
    return null
  }

  const result = (await response.json()) as LoginResponse
  return {
    token: result.accessToken,
    user: toUser(result.admin),
  }
}

export function logout(): void {
  clearStoredAuth()
}

export async function validateToken(token: string): Promise<User | null> {
  const response = await fetch(`${apiBaseUrl}/admin/auth/me`, {
    headers: { authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    return null
  }

  return toUser((await response.json()) as MeResponse)
}

export function hasRole(userRole: UserRole | null, requiredRole: UserRole): boolean {
  if (!userRole) return false
  if (requiredRole === 'admin') {
    return userRole === 'admin'
  }
  return true
}

export function isAdmin(userRole: UserRole | null): boolean {
  return userRole === 'admin'
}

function toUser(admin: LoginResponse['admin'] | MeResponse): User {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.fullName,
    role: admin.role,
    createdAt: new Date(admin.createdAt),
  }
}

function isAuthContext(value: unknown): value is AuthContext {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Partial<AuthContext>
  return (
    (candidate.token === null || typeof candidate.token === 'string') &&
    (candidate.role === null || candidate.role === 'admin' || candidate.role === 'operator') &&
    (candidate.user === null || isUser(candidate.user))
  )
}

function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Partial<User>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.name === 'string' &&
    (candidate.role === 'admin' || candidate.role === 'operator')
  )
}
