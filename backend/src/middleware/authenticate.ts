import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { ApiError } from '../utils/api-error.js'
import { USER_ROLES, type UserRole } from '../types/role.js'

function rejectAuthentication(next: Parameters<RequestHandler>[2]): void {
  next(new ApiError(401, 'unauthorized', 'A valid bearer token is required.'))
}

export const authenticate: RequestHandler = (request, _response, next) => {
  const match = request.get('authorization')?.match(/^Bearer\s+(\S+)$/i)
  if (!match) {
    rejectAuthentication(next)
    return
  }

  try {
    const payload = jwt.verify(match[1], config.jwtSecret, { algorithms: ['HS256'] })
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      rejectAuthentication(next)
      return
    }

    const userId = Number(payload.sub)
    const role = payload.role
    if (!Number.isSafeInteger(userId) || userId < 1 ||
      typeof role !== 'string' || !USER_ROLES.includes(role as UserRole)) {
      rejectAuthentication(next)
      return
    }

    request.auth = { userId, role: role as UserRole }
    next()
  } catch {
    rejectAuthentication(next)
  }
}
