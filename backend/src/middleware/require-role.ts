import type { RequestHandler } from 'express'
import { USER_ROLES, type UserRole } from '../types/role.js'
import { ApiError } from '../utils/api-error.js'

export function requireRole(...permittedRoles: UserRole[]): RequestHandler {
  if (permittedRoles.length === 0 || permittedRoles.some((role) => !USER_ROLES.includes(role))) {
    throw new Error('requireRole must be configured with one or more supported roles.')
  }

  return (request, _response, next) => {
    if (!request.auth) {
      next(new ApiError(401, 'unauthorized', 'A valid bearer token is required.'))
      return
    }

    if (!permittedRoles.includes(request.auth.role)) {
      next(new ApiError(403, 'forbidden', 'You do not have permission to access this resource.'))
      return
    }

    next()
  }
}
