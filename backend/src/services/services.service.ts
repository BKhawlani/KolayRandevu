import { database } from '../database.js'
import { ApiError } from '../utils/api-error.js'
import type { AdminServiceUpdateInput, ServiceCreateInput } from '../validation/schemas.js'

export interface ServiceRecord {
  id: number
  name: string
  description: string | null
  provider_id: number
  created_at: string
}

export function listServices(): ServiceRecord[] {
  return database.prepare(`
    SELECT id, name, description, provider_id, created_at
    FROM services
    ORDER BY created_at DESC, id DESC
  `).all() as ServiceRecord[]
}

export function getServiceById(id: number): ServiceRecord {
  const service = database.prepare(`
    SELECT id, name, description, provider_id, created_at
    FROM services
    WHERE id = ?
  `).get(id) as ServiceRecord | undefined

  if (!service) {
    throw new ApiError(404, 'service_not_found', 'The requested service was not found.')
  }

  return service
}

export function createService(input: ServiceCreateInput, providerId: number): ServiceRecord {
  const result = database.prepare(`
    INSERT INTO services (name, description, provider_id)
    VALUES (@name, @description, @provider_id)
  `).run({
    name: input.name,
    description: input.description ?? null,
    provider_id: providerId,
  })

  return getServiceById(Number(result.lastInsertRowid))
}

export function updateService(id: number, input: AdminServiceUpdateInput): ServiceRecord {
  const fields: string[] = []
  const values: unknown[] = []
  if (input.name !== undefined) {
    fields.push('name = ?')
    values.push(input.name)
  }
  if (input.description !== undefined) {
    fields.push('description = ?')
    values.push(input.description)
  }
  const result = database.prepare(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`).run(...values, id)
  if (result.changes === 0) throw new ApiError(404, 'service_not_found', 'Hizmet bulunamadı.')
  return getServiceById(id)
}

export function deleteService(id: number): void {
  try {
    const result = database.prepare('DELETE FROM services WHERE id = ?').run(id)
    if (result.changes === 0) throw new ApiError(404, 'service_not_found', 'Hizmet bulunamadı.')
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error &&
      (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' ||
        (error.code === 'SQLITE_CONSTRAINT_TRIGGER' && 'message' in error && error.message === 'FOREIGN KEY constraint failed'))) {
      throw new ApiError(409, 'service_has_appointments', 'Bu hizmet randevularda kullanıldığı için silinemez.')
    }
    throw error
  }
}
