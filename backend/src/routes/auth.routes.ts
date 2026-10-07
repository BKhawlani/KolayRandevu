import { Router } from 'express'
import { getMe, login, patchMe, patchMyPassword, register } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { validateBody } from '../middleware/validate-body.js'
import { accountUpdateSchema, passwordChangeSchema, userLoginSchema, userRegistrationSchema } from '../validation/schemas.js'

export const authRouter = Router()

authRouter.post('/register', validateBody(userRegistrationSchema), register)
authRouter.post('/login', validateBody(userLoginSchema), login)
authRouter.get('/me', authenticate, getMe)
authRouter.patch('/me', authenticate, validateBody(accountUpdateSchema), patchMe)
authRouter.patch('/me/password', authenticate, validateBody(passwordChangeSchema), patchMyPassword)
