import type { RequestHandler } from 'express'
import { createAppointment, listAppointmentsForProvider, listAppointmentsForUser, updateProviderAppointmentStatus } from '../services/appointments.service.js'
import { ApiError } from '../utils/api-error.js'
import type { AppointmentCreateInput, ProviderAppointmentStatusInput } from '../validation/schemas.js'
import { listAllAppointments, updateAppointmentStatus } from '../services/appointments.service.js'
export const getMine: RequestHandler = (request, response, next) => {
  if (!request.auth) {
    next(new ApiError(401, 'unauthorized', 'A valid bearer token is required.'))
    return
  }

  try {
    response.json({ appointments: listAppointmentsForUser(request.auth.userId) })
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
    const appointment = createAppointment(request.body as AppointmentCreateInput, request.auth.userId)
    response.status(201).json({ appointment })
  } catch (error) {
    next(error)
  }
}

export const getProviderAppointments: RequestHandler = (request, response, next) => {
  if (!request.auth) {
    next(new ApiError(401, 'unauthorized', 'A valid bearer token is required.'))
    return
  }

  try {
    response.json({ appointments: listAppointmentsForProvider(request.auth.userId) })
  } catch (error) {
    next(error)
  }
}

export const updateProviderStatus: RequestHandler = (request, response, next) => {
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
    const body = request.body as ProviderAppointmentStatusInput
    const appointment = updateProviderAppointmentStatus(appointmentId, request.auth.userId, body.status)
    response.json({ appointment })
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
    const body = request.body as { status: 'beklemede' | 'onaylandi' | 'reddedildi' | 'tamamlandi' }
    const appointment = updateAppointmentStatus(appointmentId, body.status)
    response.json({ appointment })
  } catch (error) {
    next(error)
  }
}
