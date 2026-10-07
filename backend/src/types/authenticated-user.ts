import type { UserRole } from './role.js'

export interface AuthenticatedUser {
  userId: number
  role: UserRole
}
