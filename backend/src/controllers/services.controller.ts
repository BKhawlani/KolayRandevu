import type { RequestHandler } from 'express'
import { createService, getServiceById, listServices } from '../services/services.service.js'
import { ApiError } from '../utils/api-error.js'
import type { ServiceCreateInput } from '../validation/schemas.js'

export const list: RequestHandler = (_request, response, next) => {
  try {
    response.json({ services: listServices() })
  } catch (error) {
    next(error)
  }
}

export const getById: RequestHandler = (request, response, next) => {
  const idText = request.params.id
  if (typeof idText !== 'string' || !/^\d+$/.test(idText) || Number(idText) < 1 || !Number.isSafeInteger(Number(idText))) {
    next(new ApiError(400, 'invalid_service_id', 'Service ID must be a positive integer.'))
    return
  }

  try {
    response.json({ service: getServiceById(Number(idText)) })
  } catch (error) {
    next(error)
  }
}

export const create: RequestHandler = (request, response, next) => {
  if (!request.auth) {
    next(new ApiError(401, 'unauthorized', 'A valid bearer token is required.'))
    return
  }

  try {
    const service = createService(request.body as ServiceCreateInput, request.auth.userId)
    response.status(201).json({ service })
  } catch (error) {
    next(error)
  }
}
