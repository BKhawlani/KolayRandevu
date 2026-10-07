import type { ErrorRequestHandler } from 'express'
import { ApiError } from '../utils/api-error.js'

interface JsonParseError extends Error {
  status?: number
  type?: string
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  if (response.headersSent) {
    next(error)
    return
  }

  if (error instanceof ApiError) {
    response.status(error.status).json({
      error: { code: error.code, message: error.message },
    })
    return
  }

  const requestError = error as JsonParseError
  if (requestError?.type === 'entity.parse.failed' && requestError.status === 400) {
    response.status(400).json({
      error: { code: 'invalid_json', message: 'Request body must contain valid JSON.' },
    })
    return
  }

  console.error('Unexpected API error:', error)
  response.status(500).json({
    error: { code: 'internal_error', message: 'An unexpected error occurred.' },
  })
}
