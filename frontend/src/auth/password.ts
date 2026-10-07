export const strongPasswordMessage = 'Şifre 8–72 karakter/UTF-8 bayt olmalı; büyük harf, küçük harf, rakam ve özel karakter içermeli.'

export function hasStrongPassword(password: string): boolean {
  const bytes = new TextEncoder().encode(password).length
  return password.length >= 8 && password.length <= 72 && bytes <= 72 &&
    /\p{Lu}/u.test(password) && /\p{Ll}/u.test(password) && /\p{N}/u.test(password) && /[\p{P}\p{S}]/u.test(password)
}
