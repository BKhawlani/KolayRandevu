import { Router } from 'express'
import { create, getById, list } from '../controllers/services.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/require-role.js'
import { validateBody } from '../middleware/validate-body.js'
import { serviceCreateSchema } from '../validation/schemas.js'

export const servicesRouter = Router()

servicesRouter.get('/', list)
servicesRouter.get('/:id', getById)
servicesRouter.post(
  '/',
  authenticate,
  requireRole('hizmetci', 'admin'),
  validateBody(serviceCreateSchema),
  create,
)
