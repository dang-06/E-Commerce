'use client'

import { User, UserRole } from '@/lib/types'
import { mockAuthTokens, mockUsers } from '@/lib/mock-data/users'

export interface AuthContext {
  user: User | null
  token: string | null
  role: UserRole | null
}

const AUTH_STORAGE_KEY = 'auth_context'

/**
 * Get stored auth context from localStorage
 */
export function getStoredAuth(): AuthContext | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

/**
 * Store auth context to localStorage
 */
export function setStoredAuth(auth: AuthContext): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
  } catch (e) {
    console.error('Failed to store auth:', e)
  }
}

/**
 * Clear stored auth context
 */
export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch (e) {
    console.error('Failed to clear auth:', e)
  }
}

/**
 * Mock login function
 * Accepted credentials:
 * - admin@store.com / any password (admin role)
 * - operator@store.com / any password (operator role)
 */
export async function mockLogin(
  email: string,
  password: string
): Promise<{ user: User; token: string } | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const user = mockUsers.find((u) => u.email === email)
  if (!user) {
    return null
  }

  const token = mockAuthTokens[email] || 'token_' + email.replace('@', '_')

  return { user, token }
}

/**
 * Mock logout function
 */
export async function mockLogout(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  clearStoredAuth()
}

/**
 * Validate token and get user
 */
export async function validateToken(token: string): Promise<User | null> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Find user by token
  for (const [email, tokenValue] of Object.entries(mockAuthTokens)) {
    if (tokenValue === token) {
      return mockUsers.find((u) => u.email === email) || null
    }
  }

  return null
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole | null, requiredRole: UserRole): boolean {
  if (!userRole) return false
  if (requiredRole === 'admin') {
    return userRole === 'admin'
  }
  return true // operators can access operator features
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: UserRole | null): boolean {
  return userRole === 'admin'
}
