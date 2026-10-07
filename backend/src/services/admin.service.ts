import { database } from '../database.js'
import type { PublicUser } from './auth.service.js'

export function listUsersForAdmin(): PublicUser[] {
  return database.prepare(`
    SELECT id, name, email, role, created_at
    FROM users
    ORDER BY created_at DESC, id DESC
  `).all() as PublicUser[]
}
