import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../utils/api-error.js'

export function notFound(_request: Request, _response: Response, next: NextFunction): void {
  next(new ApiError(404, 'not_found', 'The requested resource was not found.'))
}
