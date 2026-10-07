import bcrypt from 'bcryptjs'
import { database } from '../database.js'
import { userRegistrationSchema } from '../validation/schemas.js'

const adminEmail = 'engbashar@kolayrandevu.invalid'
const password = process.env.DEMO_ADMIN_PASSWORD

const demoServices = [
  ['Sağlık Danışmanlığı', 'Sunum ve değerlendirme için hazırlanmış kurgusal demo hizmetidir.'],
  ['Klinik Muayene', 'Gerçek bir kliniği temsil etmeyen örnek hizmet kaydıdır.'],
  ['Psikolojik Danışmanlık', 'Sunum amacıyla oluşturulmuş kurgusal hizmettir.'],
  ['Diş Hekimi', 'Herhangi bir gerçek kişi veya işletmeyle ilişkisi olmayan demo kaydıdır.'],
  ['Beslenme Danışmanlığı', 'Uygulamayı göstermek için eklenen örnek hizmettir.'],
  ['Fizyoterapi', 'Kurgusal demo hizmeti; gerçek sağlık hizmeti sunmaz.'],
] as const

const existingAdmin = database.prepare('SELECT id, role FROM users WHERE email = ? COLLATE NOCASE').get(adminEmail) as { id: number; role: string } | undefined
let adminId: number

if (existingAdmin) {
  if (existingAdmin.role !== 'admin') {
    throw new Error(`The reserved demo admin email ${adminEmail} already belongs to a non-admin account.`)
  }
  adminId = existingAdmin.id
} else {
  if (!password) throw new Error('Set DEMO_ADMIN_PASSWORD in backend/.env before running npm run seed:demo.')
  const parsed = userRegistrationSchema.parse({ name: 'Demo Admin', email: adminEmail, password })
  const hash = await bcrypt.hash(parsed.password, 12)
  const result = database.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, 'admin')
  `).run(parsed.name, parsed.email, hash)
  adminId = Number(result.lastInsertRowid)
}

const findService = database.prepare('SELECT id FROM services WHERE provider_id = ? AND name = ?')
const addService = database.prepare('INSERT INTO services (name, description, provider_id) VALUES (?, ?, ?)')
const seedServices = database.transaction(() => {
  for (const [name, description] of demoServices) {
    if (!findService.get(adminId, name)) addService.run(name, description, adminId)
  }
})
seedServices()

console.log(`Demo admin and fictional services are ready. Login identifier: engbashar. Admin account email: ${adminEmail}.`)
database.close()
