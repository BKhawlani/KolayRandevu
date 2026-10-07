import type { AuthSession, UserRole } from './types'

const AUTH_STORAGE_KEY = 'kolayrandevu.auth'
const roles: UserRole[] = ['kullanici', 'hizmetci', 'admin']

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false
  const session = value as Partial<AuthSession>
  const user = session.user

  return typeof session.token === 'string' && session.token.length > 0 &&
    !!user && typeof user === 'object' &&
    Number.isSafeInteger(user.id) &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    roles.includes(user.role)
}

export function readAuthSession(): AuthSession | null {
  try {
    const stored = window.sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) return null

    const parsed: unknown = JSON.parse(stored)
    if (isAuthSession(parsed)) return parsed

    window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  } catch {
    return null
  }
}

export function writeAuthSession(session: AuthSession): void {
  window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession(): void {
  try {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // Clear in-memory auth even if browser storage is unavailable.
  }
}
