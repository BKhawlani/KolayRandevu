import { Router } from 'express'
import { create, getMine } from '../controllers/appointments.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/require-role.js'
import { validateBody } from '../middleware/validate-body.js'
import { appointmentCreateSchema } from '../validation/schemas.js'

export const appointmentsRouter = Router()

appointmentsRouter.get('/me', authenticate, getMine)
appointmentsRouter.post(
  '/',
  authenticate,
  requireRole('kullanici'),
  validateBody(appointmentCreateSchema),
  create,
)
