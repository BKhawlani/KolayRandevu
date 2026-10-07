import { Router } from 'express'
import { getHealth } from '../controllers/health.controller.js'
import { authRouter } from './auth.routes.js'
import { appointmentsRouter } from './appointments.routes.js'
import { servicesRouter } from './services.routes.js'
import { providerRouter } from './provider.routes.js'
import { adminRouter } from './admin.routes.js'

export const apiRouter = Router()

apiRouter.get('/health', getHealth)
apiRouter.use('/auth', authRouter)
apiRouter.use('/services', servicesRouter)
apiRouter.use('/appointments', appointmentsRouter)
apiRouter.use('/provider', providerRouter)
apiRouter.use('/admin', adminRouter)

// Future route modules for auth, services, and appointments can be mounted here.
