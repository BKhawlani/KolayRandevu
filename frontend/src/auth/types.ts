export type UserRole = 'kullanici' | 'hizmetci' | 'admin'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
  created_at?: string
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export interface LoginResponse extends AuthSession {
  token_type: string
  expires_in: number
}

export interface RegisterResponse {
  user: AuthUser & { created_at?: string }
}
