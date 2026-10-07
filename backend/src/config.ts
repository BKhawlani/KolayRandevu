import 'dotenv/config'
import path from 'node:path'

const jwtSecret = process.env.JWT_SECRET?.trim()
const developmentSecretPlaceholder = 'development-only-change-this-secret-before-deployment-000000'

if (!jwtSecret || Buffer.byteLength(jwtSecret, 'utf8') < 32) {
  throw new Error('JWT_SECRET must be set to a secret with at least 32 characters.')
}

if (process.env.NODE_ENV === 'production' && jwtSecret === developmentSecretPlaceholder) {
  throw new Error('Replace the development JWT_SECRET placeholder before running in production.')
}

const jwtExpiresInSeconds = Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 3600)
if (!Number.isInteger(jwtExpiresInSeconds) || jwtExpiresInSeconds < 1 || jwtExpiresInSeconds > 2_592_000) {
  throw new Error('JWT_EXPIRES_IN_SECONDS must be an integer between 1 and 2592000.')
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databasePath: path.resolve(process.cwd(), process.env.DATABASE_PATH ?? './data/kolayrandevu.sqlite'),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  jwtSecret,
  jwtExpiresInSeconds,
}
