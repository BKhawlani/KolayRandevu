import { Router } from 'express'
import { getServices, getUsers, patchService, postService, removeService } from '../controllers/admin.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireRole } from '../middleware/require-role.js'
import { validateBody } from '../middleware/validate-body.js'
import { adminAppointmentStatusSchema, adminServiceCreateSchema, adminServiceUpdateSchema } from '../validation/schemas.js'
import { getAllAppointments, updateAppointmentStatusAdmin } from '../controllers/admin.controller.js'

export const adminRouter = Router()

adminRouter.use(authenticate, requireRole('admin'))
adminRouter.get('/users', getUsers)
adminRouter.get('/services', getServices)
adminRouter.post('/services', validateBody(adminServiceCreateSchema), postService)
adminRouter.patch('/services/:id', validateBody(adminServiceUpdateSchema), patchService)
adminRouter.delete('/services/:id', removeService)
adminRouter.get('/appointments', getAllAppointments)
adminRouter.patch('/appointments/:id/status', validateBody(adminAppointmentStatusSchema), updateAppointmentStatusAdmin)
