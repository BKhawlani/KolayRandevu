import type { RequestHandler } from 'express'
import { ApiError } from '../utils/api-error.js'
import { listUsersForAdmin } from '../services/admin.service.js'
import { createService, deleteService, listServices, updateService } from '../services/services.service.js'
import type { AdminAppointmentStatusInput, AdminServiceCreateInput, AdminServiceUpdateInput } from '../validation/schemas.js'
import { listAllAppointments, updateAppointmentStatus } from '../services/appointments.service.js'
function parseId(raw: string | string[] | undefined): number | null {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return null
  const id = Number(raw)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export const getUsers: RequestHandler = (_request, response, next) => {
  try {
    response.json({ users: listUsersForAdmin() })
  } catch (error) {
    next(error)
  }
}

export const getServices: RequestHandler = (_request, response, next) => {
  try {
    response.json({ services: listServices() })
  } catch (error) {
    next(error)
  }
}

export const postService: RequestHandler = (request, response, next) => {
  if (!request.auth) {
    next(new ApiError(401, 'unauthorized', 'A valid bearer token is required.'))
    return
  }
  try {
    const service = createService(request.body as AdminServiceCreateInput, request.auth.userId)
    response.status(201).json({ service })
  } catch (error) {
    next(error)
  }
}

export const patchService: RequestHandler = (request, response, next) => {
  const id = parseId(request.params.id)
  if (!id) {
    next(new ApiError(404, 'service_not_found', 'Hizmet bulunamadı.'))
    return
  }
  try {
    response.json({ service: updateService(id, request.body as AdminServiceUpdateInput) })
  } catch (error) {
    next(error)
  }
}

export const removeService: RequestHandler = (request, response, next) => {
  const id = parseId(request.params.id)
  if (!id) {
    next(new ApiError(404, 'service_not_found', 'Hizmet bulunamadı.'))
    return
  }
  try {
    deleteService(id)
    response.status(204).end()
  } catch (error) {
    next(error)
  }
}

export const getAllAppointments: RequestHandler = (request, response, next) => {
  if (!request.auth) {
    next(new ApiError(401, 'unauthorized', 'A valid bearer token is required.'))
    return
  }

  try {
    response.json({ appointments: listAllAppointments() })
  } catch (error) {
    next(error)
  }
}

export const updateAppointmentStatusAdmin: RequestHandler = (request, response, next) => {
  if (!request.auth) {
    next(new ApiError(401, 'unauthorized', 'A valid bearer token is required.'))
    return
  }

  const appointmentId = Number(request.params.id)
  if (!Number.isSafeInteger(appointmentId) || appointmentId < 1) {
    next(new ApiError(404, 'appointment_not_found', 'The appointment was not found.'))
    return
  }

  try {
    const body = request.body as AdminAppointmentStatusInput
    const appointment = updateAppointmentStatus(appointmentId, body.status)
    response.json({ appointment })
  } catch (error) {
    next(error)
  }
}
