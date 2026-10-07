import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { database } from '../database.js'
import { config } from '../config.js'
import { ApiError } from '../utils/api-error.js'
import type { UserRole } from '../types/role.js'
import type { AccountUpdateInput, PasswordChangeInput, UserLoginInput, UserRegistrationInput } from '../validation/schemas.js'

const BCRYPT_ROUNDS = 12
const DEMO_ADMIN_EMAIL = 'engbashar@kolayrandevu.invalid'

export interface PublicUser {
  id: number
  name: string
  email: string
  role: UserRole
  created_at: string
}

interface StoredUser extends PublicUser {
  password_hash: string
}

function findUserByEmail(email: string): StoredUser | undefined {
  return database.prepare(`
    SELECT id, name, email, password_hash, role, created_at
    FROM users
    WHERE email = ? COLLATE NOCASE
  `).get(email) as StoredUser | undefined
}

function publicUser(user: PublicUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null &&
    'code' in error && error.code === 'SQLITE_CONSTRAINT_UNIQUE'
}

export async function registerUser(input: UserRegistrationInput): Promise<PublicUser> {
  if (input.email === DEMO_ADMIN_EMAIL) {
    throw new ApiError(409, 'email_reserved', 'Bu e-posta adresi demo yönetici hesabı için ayrılmıştır.')
  }
  if (findUserByEmail(input.email)) {
    throw new ApiError(409, 'email_already_registered', 'An account with this email already exists.')
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)

  try {
    const result = database.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, 'kullanici')
    `).run(input.name, input.email, passwordHash)

    const user = database.prepare(`
      SELECT id, name, email, role, created_at
      FROM users
      WHERE id = ?
    `).get(Number(result.lastInsertRowid)) as PublicUser | undefined

    if (!user) throw new Error('Inserted user could not be loaded.')
    return publicUser(user)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ApiError(409, 'email_already_registered', 'An account with this email already exists.')
    }
    throw error
  }
}

export async function loginUser(input: UserLoginInput): Promise<{
  token: string
  expires_in: number
  user: PublicUser
}> {
  const lookupEmail = input.email === 'engbashar' ? DEMO_ADMIN_EMAIL : input.email
  const user = findUserByEmail(lookupEmail)
  if (!user || (input.email === 'engbashar' && user.role !== 'admin') || !(await bcrypt.compare(input.password, user.password_hash))) {
    throw new ApiError(401, 'invalid_credentials', 'Invalid email or password.')
  }

  const safeUser = publicUser(user)
  const token = jwt.sign(
    { role: safeUser.role },
    config.jwtSecret,
    {
      algorithm: 'HS256',
      subject: String(safeUser.id),
      expiresIn: config.jwtExpiresInSeconds,
    },
  )

  return { token, expires_in: config.jwtExpiresInSeconds, user: safeUser }
}

export function getCurrentUser(userId: number): PublicUser {
  const user = database.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(userId) as PublicUser | undefined
  if (!user) throw new ApiError(404, 'user_not_found', 'Hesap bulunamadı.')
  return publicUser(user)
}

export function updateCurrentUser(userId: number, input: AccountUpdateInput): PublicUser {
  if (input.email === DEMO_ADMIN_EMAIL) {
    const reserved = database.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(DEMO_ADMIN_EMAIL) as { id: number } | undefined
    if (!reserved || reserved.id !== userId) {
      throw new ApiError(409, 'email_reserved', 'Bu e-posta adresi demo yönetici hesabı için ayrılmıştır.')
    }
  }
  try {
    database.prepare(`
      UPDATE users
      SET name = COALESCE(?, name), email = COALESCE(?, email)
      WHERE id = ?
    `).run(input.name ?? null, input.email ?? null, userId)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ApiError(409, 'email_already_registered', 'Bu e-posta adresi başka bir hesapta kullanılıyor.')
    }
    throw error
  }
  return getCurrentUser(userId)
}

export async function changeCurrentPassword(userId: number, input: PasswordChangeInput): Promise<void> {
  const user = database.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as { password_hash: string } | undefined
  if (!user) throw new ApiError(404, 'user_not_found', 'Hesap bulunamadı.')
  if (!(await bcrypt.compare(input.current_password, user.password_hash))) {
    throw new ApiError(400, 'current_password_incorrect', 'Mevcut şifren hatalı.')
  }

  const passwordHash = await bcrypt.hash(input.new_password, BCRYPT_ROUNDS)
  database.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId)
}
