import { Router } from 'express'
import { getProviderAppointments, updateProviderStatus } from '../controllers/appointments.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/require-role.js'
import { validateBody } from '../middleware/validate-body.js'
import { providerAppointmentStatusSchema } from '../validation/schemas.js'

export const providerRouter = Router()

providerRouter.use(authenticate, requireRole('hizmetci'))
providerRouter.get('/appointments', getProviderAppointments)
providerRouter.patch('/appointments/:id/status', validateBody(providerAppointmentStatusSchema), updateProviderStatus)
