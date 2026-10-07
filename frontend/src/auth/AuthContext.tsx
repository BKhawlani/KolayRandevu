import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { apiRequest } from '../api/client'
import type { LoginResponse, AuthSession, AuthUser } from './types'
import type { UserRole } from './types'
import { clearAuthSession, readAuthSession, writeAuthSession } from './storage'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<UserRole>
  logout: () => void
  updateUser: (user: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readAuthSession())

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    const nextSession: AuthSession = {
      token: result.token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        created_at: result.user.created_at,
      },
    }

    try {
      writeAuthSession(nextSession)
    } catch {
      throw new Error('Oturum bu tarayıcıda saklanamadı. Gizli mod veya depolama ayarlarını kontrol et.')
    }

    setSession(nextSession)
    return nextSession.user.role
  }, [])

  const logout = useCallback(() => {
    clearAuthSession()
    setSession(null)
  }, [])

  const updateUser = useCallback((user: AuthUser) => {
    setSession((current) => {
      if (!current) return current
      const next = { ...current, user }
      try { writeAuthSession(next) } catch { /* In-memory profile remains current for this session. */ }
      return next
    })
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    token: session?.token ?? null,
    isAuthenticated: session !== null,
    isLoading: false,
    login,
    logout,
    updateUser,
  }), [session, login, logout, updateUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider.')
  return context
}
