import { z } from 'zod'
import { Buffer } from 'node:buffer'

const requiredString = (fieldName: string) =>
  z.string({ error: `${fieldName} is required.` })

const strongPassword = z.string({ error: 'Şifre gerekli.' })
  .min(8, 'Şifre en az 8 karakter olmalı.')
  .max(72, 'Şifre en fazla 72 karakter olabilir.')
  .refine((password) => Buffer.byteLength(password, 'utf8') <= 72, 'Şifre en fazla 72 UTF-8 bayt olabilir.')
  .refine((password) => /\p{Lu}/u.test(password) && /\p{Ll}/u.test(password) && /\p{N}/u.test(password) && /[\p{P}\p{S}]/u.test(password), 'Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermeli.')

export const userRegistrationSchema = z.object({
  name: requiredString('Name')
    .trim()
    .min(2, 'Name must be at least 2 characters long.')
    .max(100, 'Name must be at most 100 characters long.'),
  email: requiredString('Email')
    .trim()
    .email('Email must be a valid email address.')
    .max(254, 'Email must be at most 254 characters long.')
    .toLowerCase(),
  password: strongPassword,
}).strict()

export const userLoginSchema = z.object({
  email: requiredString('Email or login identifier')
    .trim()
    .max(254, 'Login identifier is too long.')
    .toLowerCase()
    .refine((value) => value === 'engbashar' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'Geçerli e-posta adresi veya kullanıcı adı gir.'),
  password: requiredString('Password')
    .min(8, 'Password must be at least 8 characters long.')
    .max(72, 'Password must be at most 72 characters long.')
    .refine((password) => Buffer.byteLength(password, 'utf8') <= 72, 'Password must be at most 72 bytes when UTF-8 encoded.'),
}).strict()

export const serviceSchema = z.object({
  name: requiredString('Service name')
    .trim()
    .min(1, 'Service name is required.')
    .max(120, 'Service name must be at most 120 characters long.'),
  description: z.string().max(2000, 'Service description must be at most 2000 characters long.').optional(),
  provider_id: z.number({ error: 'provider_id is required and must be a positive integer.' })
    .int('provider_id must be an integer.')
    .positive('provider_id must be a positive integer.'),
})

export const serviceCreateSchema = serviceSchema.omit({ provider_id: true }).strict()

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const [, yearText, monthText, dayText] = match
  const date = new Date(0)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(Number(yearText), Number(monthText) - 1, Number(dayText))

  return date.toISOString().slice(0, 10) === value
}

export const appointmentSchema = z.object({
  service_id: z.number({ error: 'service_id is required and must be a positive integer.' })
    .int('service_id must be an integer.')
    .positive('service_id must be a positive integer.'),
  appointment_date: requiredString('Appointment date')
    .refine(isCalendarDate, 'Appointment date must be a valid date in YYYY-MM-DD format.'),
  appointment_time: requiredString('Appointment time')
    .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Appointment time must be a valid time in HH:mm format.'),
  description: z.string().max(1000, 'Appointment description must be at most 1000 characters long.').optional(),
})

export const appointmentCreateSchema = appointmentSchema.strict()

export const providerAppointmentStatusSchema = z.object({
  status: z.enum(['onaylandi', 'reddedildi'], {
    error: 'Status must be onaylandi or reddedildi.',
  }),
}).strict()

export const adminAppointmentStatusSchema = z.object({
  status: z.enum(['beklemede', 'onaylandi', 'reddedildi', 'tamamlandi'], {
    error: 'Geçerli bir randevu durumu seç.',
  }),
}).strict()

export const accountUpdateSchema = z.object({
  name: requiredString('Name').trim().min(2, 'Ad en az 2 karakter olmalı.').max(100, 'Ad en fazla 100 karakter olabilir.').optional(),
  email: requiredString('Email').trim().email('Geçerli bir e-posta adresi gir.').max(254, 'E-posta en fazla 254 karakter olabilir.').toLowerCase().optional(),
}).strict().refine((value) => value.name !== undefined || value.email !== undefined, 'En az bir alanı güncelle.')

export const passwordChangeSchema = z.object({
  current_password: requiredString('Mevcut şifre'),
  new_password: strongPassword,
}).strict().refine((value) => value.current_password !== value.new_password, {
  message: 'Yeni şifre mevcut şifrenizden farklı olmalı.',
  path: ['new_password'],
})

export const adminServiceCreateSchema = z.object({
  name: requiredString('Service name').trim().min(1, 'Hizmet adı gerekli.').max(120, 'Hizmet adı en fazla 120 karakter olabilir.'),
  description: z.string().max(2000, 'Açıklama en fazla 2000 karakter olabilir.').optional(),
}).strict()

export const adminServiceUpdateSchema = z.object({
  name: requiredString('Service name').trim().min(1, 'Hizmet adı boş olamaz.').max(120, 'Hizmet adı en fazla 120 karakter olabilir.').optional(),
  description: z.string().max(2000, 'Açıklama en fazla 2000 karakter olabilir.').optional(),
}).strict().refine((value) => value.name !== undefined || value.description !== undefined, 'En az bir alanı güncelle.')

export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>
export type UserLoginInput = z.infer<typeof userLoginSchema>
export type ServiceInput = z.infer<typeof serviceSchema>
export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>
export type AppointmentInput = z.infer<typeof appointmentSchema>
export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>
export type ProviderAppointmentStatusInput = z.infer<typeof providerAppointmentStatusSchema>
export type AdminAppointmentStatusInput = z.infer<typeof adminAppointmentStatusSchema>
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>
export type AdminServiceCreateInput = z.infer<typeof adminServiceCreateSchema>
export type AdminServiceUpdateInput = z.infer<typeof adminServiceUpdateSchema>
