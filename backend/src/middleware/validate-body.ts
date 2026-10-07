import type { RequestHandler } from 'express'
import type { z } from 'zod'
import { ApiError } from '../utils/api-error.js'

export function validateBody<TSchema extends z.ZodType>(schema: TSchema): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body)

    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(' ')
      next(new ApiError(400, 'validation_error', message))
      return
    }

    request.body = result.data
    next()
  }
}
