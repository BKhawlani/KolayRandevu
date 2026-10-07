export const USER_ROLES = ['kullanici', 'hizmetci', 'admin'] as const

export type UserRole = (typeof USER_ROLES)[number]
