import { database } from '../database.js'
import { ApiError } from '../utils/api-error.js'
import type { AdminAppointmentStatusInput, AppointmentCreateInput } from '../validation/schemas.js'

export interface AppointmentRecord {
  id: number
  user_id: number
  service_id: number
  appointment_date: string
  appointment_time: string
  description: string | null
  status: string
  created_at: string
  service_name: string
}

export interface ProviderAppointmentRecord extends Omit<AppointmentRecord, 'user_id'> {
  customer_name: string
  customer_email: string
}

export interface AdminAppointmentRecord extends AppointmentRecord {
  user_name: string
  user_email: string
}

const appointmentSelect = `
  SELECT
    appointments.id,
    appointments.user_id,
    appointments.service_id,
    appointments.appointment_date,
    appointments.appointment_time,
    appointments.description,
    appointments.status,
    appointments.created_at,
    services.name AS service_name
  FROM appointments
  INNER JOIN services ON services.id = appointments.service_id
`

const adminAppointmentSelect = `
  SELECT
    appointments.id,
    appointments.user_id,
    appointments.service_id,
    appointments.appointment_date,
    appointments.appointment_time,
    appointments.description,
    appointments.status,
    appointments.created_at,
    services.name AS service_name,
    users.name AS user_name,
    users.email AS user_email
  FROM appointments
  INNER JOIN services ON services.id = appointments.service_id
  INNER JOIN users ON users.id = appointments.user_id
`

export function createAppointment(input: AppointmentCreateInput, userId: number): AppointmentRecord {
  const service = database.prepare('SELECT id FROM services WHERE id = ?').get(input.service_id)
  if (!service) {
    throw new ApiError(404, 'service_not_found', 'The requested service was not found.')
  }

  const result = database.prepare(`
    INSERT INTO appointments (
      user_id,
      service_id,
      appointment_date,
      appointment_time,
      description
    ) VALUES (
      @user_id,
      @service_id,
      @appointment_date,
      @appointment_time,
      @description
    )
  `).run({
    user_id: userId,
    service_id: input.service_id,
    appointment_date: input.appointment_date,
    appointment_time: input.appointment_time,
    description: input.description ?? null,
  })

  const appointment = database.prepare(`${appointmentSelect} WHERE appointments.id = ?`)
    .get(Number(result.lastInsertRowid)) as AppointmentRecord | undefined

  if (!appointment) throw new Error('Inserted appointment could not be loaded.')
  return appointment
}

export function listAppointmentsForUser(userId: number): AppointmentRecord[] {
  return database.prepare(`
    ${appointmentSelect}
    WHERE appointments.user_id = ?
    ORDER BY appointments.appointment_date DESC,
      appointments.appointment_time DESC,
      appointments.id DESC
  `).all(userId) as AppointmentRecord[]
}

export function listAppointmentsForProvider(providerId: number): ProviderAppointmentRecord[] {
  return database.prepare(`
    SELECT
      appointments.id,
      appointments.service_id,
      appointments.appointment_date,
      appointments.appointment_time,
      appointments.description,
      appointments.status,
      appointments.created_at,
      services.name AS service_name,
      users.name AS customer_name,
      users.email AS customer_email
    FROM appointments
    INNER JOIN services ON services.id = appointments.service_id
    INNER JOIN users ON users.id = appointments.user_id
    WHERE services.provider_id = ?
    ORDER BY appointments.appointment_date ASC,
      appointments.appointment_time ASC,
      appointments.id ASC
  `).all(providerId) as ProviderAppointmentRecord[]
}

export function updateProviderAppointmentStatus(
  appointmentId: number,
  providerId: number,
  status: 'onaylandi' | 'reddedildi',
): ProviderAppointmentRecord {
  const appointment = database.prepare(`
    SELECT appointments.id
    FROM appointments
    INNER JOIN services ON services.id = appointments.service_id
    WHERE appointments.id = ? AND services.provider_id = ?
  `).get(appointmentId, providerId)
  if (!appointment) {
    throw new ApiError(404, 'appointment_not_found', 'The appointment was not found.')
  }

  const result = database.prepare(`
    UPDATE appointments
    SET status = ?
    WHERE id = ? AND status = 'beklemede'
  `).run(status, appointmentId)
  if (result.changes === 0) {
    throw new ApiError(409, 'appointment_already_processed', 'This appointment has already been processed.')
  }
  return database.prepare(`
    SELECT
      appointments.id,
      appointments.service_id,
      appointments.appointment_date,
      appointments.appointment_time,
      appointments.description,
      appointments.status,
      appointments.created_at,
      services.name AS service_name,
      users.name AS customer_name,
      users.email AS customer_email
    FROM appointments
    INNER JOIN services ON services.id = appointments.service_id
    INNER JOIN users ON users.id = appointments.user_id
    WHERE appointments.id = ?
  `).get(appointmentId) as ProviderAppointmentRecord
}

export function listAllAppointments(): AdminAppointmentRecord[] {
  return database.prepare(`
    ${adminAppointmentSelect}
    ORDER BY appointments.appointment_date DESC,
      appointments.appointment_time DESC,
      appointments.id DESC
  `).all() as AdminAppointmentRecord[]
}

export function updateAppointmentStatus(
  appointmentId: number,
  status: AdminAppointmentStatusInput['status'],
): AdminAppointmentRecord {
  const appointment = database.prepare(`
    SELECT appointments.id
    FROM appointments
    WHERE appointments.id = ?
  `).get(appointmentId)
  if (!appointment) {
    throw new ApiError(404, 'appointment_not_found', 'The appointment was not found.')
  }

  const result = database.prepare(`
    UPDATE appointments
    SET status = ?
    WHERE id = ?
  `).run(status, appointmentId)
  if (result.changes === 0) {
    // This should not happen if appointment exists, but just in case
    throw new ApiError(409, 'appointment_not_modified', 'Appointment status could not be updated.')
  }
  return database.prepare(`
    ${adminAppointmentSelect}
    WHERE appointments.id = ?
  `).get(appointmentId) as AdminAppointmentRecord
}
