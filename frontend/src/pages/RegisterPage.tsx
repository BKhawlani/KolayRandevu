import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest, ApiRequestError } from '../api/client'
import { AuthLayout } from '../components/AuthLayout'
import type { RegisterResponse } from '../auth/types'
import { hasStrongPassword, strongPasswordMessage } from '../auth/password'

interface RegisterValues {
  name: string
  email: string
  password: string
  passwordConfirmation: string
}

type RegisterField = keyof RegisterValues
type RegisterErrors = Partial<Record<RegisterField, string>>

const initialValues: RegisterValues = { name: '', email: '', password: '', passwordConfirmation: '' }

function validate(values: RegisterValues): RegisterErrors {
  const errors: RegisterErrors = {}
  const name = values.name.trim()
  const email = values.email.trim()

  if (name.length < 2) errors.name = 'Ad en az 2 karakter olmalı.'
  else if (name.length > 100) errors.name = 'Ad en fazla 100 karakter olabilir.'

  if (!email) errors.email = 'E-posta adresini yaz.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Geçerli bir e-posta adresi yaz.'
  else if (email.length > 254) errors.email = 'E-posta adresi en fazla 254 karakter olabilir.'

  if (!hasStrongPassword(values.password)) errors.password = strongPasswordMessage

  if (!values.passwordConfirmation) errors.passwordConfirmation = 'Şifreni tekrar yaz.'
  else if (values.password !== values.passwordConfirmation) errors.passwordConfirmation = 'Şifreler eşleşmiyor.'

  return errors
}

export function RegisterPage() {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const submitLock = useRef(false)

  function updateField(field: RegisterField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setFormError('')
    setSuccess(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitLock.current) return

    const nextErrors = validate(values)
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length > 0) return

    submitLock.current = true
    setIsSubmitting(true)
    try {
      await apiRequest<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: {
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
        },
      })
      setSuccess(true)
      setValues(initialValues)
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'email_already_registered') {
        setFormError('Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyebilirsin.')
      } else {
        setFormError(error instanceof ApiRequestError
          ? error.message
          : error instanceof Error ? error.message : 'Kayıt tamamlanamadı. Lütfen tekrar dene.')
      }
    } finally {
      submitLock.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Aramıza katıl"
      title="Randevuların daha kolay olsun."
      description="Hesabını oluştur, taleplerini tek yerden iletip takip etmeye başla."
    >
      {success ? (
        <div className="auth-success" role="status" aria-live="polite">
          <span className="success-mark" aria-hidden="true">✓</span>
          <h2>Hesabın hazır.</h2>
          <p>Şimdi giriş yaparak KolayRandevu’yu kullanmaya başlayabilirsin.</p>
          <Link className="button button-primary auth-submit" to="/login">Giriş yap</Link>
        </div>
      ) : (
        <>
          <div className="auth-card-heading">
            <p className="eyebrow">Ücretsiz hesap</p>
            <h2>Hesap oluştur</h2>
            <p>Başlamak için bilgilerini gir.</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {formError && <div className="form-alert" role="alert" aria-live="assertive">{formError}</div>}
            <div className="form-field">
              <label htmlFor="register-name">Ad soyad</label>
              <input id="register-name" name="name" autoComplete="name" maxLength={100} value={values.name} onChange={(event) => updateField('name', event.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'register-name-error' : undefined} />
              {errors.name && <span className="field-error" id="register-name-error">{errors.name}</span>}
            </div>
            <div className="form-field">
              <label htmlFor="register-email">E-posta</label>
              <input id="register-email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} value={values.email} onChange={(event) => updateField('email', event.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'register-email-error' : undefined} />
              {errors.email && <span className="field-error" id="register-email-error">{errors.email}</span>}
            </div>
            <div className="form-field">
              <label htmlFor="register-password">Şifre</label>
              <div className="password-input-wrap"><input id="register-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={values.password} onChange={(event) => updateField('password', event.target.value)} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'register-password-error' : 'register-password-help'} /><button className="password-toggle" type="button" aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? 'Gizle' : 'Göster'}</button></div>
              {errors.password ? <span className="field-error" id="register-password-error">{errors.password}</span> : <span className="field-help" id="register-password-help">En az 8 karakter; büyük/küçük harf, rakam ve özel karakter.</span>}
            </div>
            <div className="form-field">
              <label htmlFor="register-password-confirmation">Şifre tekrar</label>
              <div className="password-input-wrap"><input id="register-password-confirmation" name="passwordConfirmation" type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" value={values.passwordConfirmation} onChange={(event) => updateField('passwordConfirmation', event.target.value)} aria-invalid={!!errors.passwordConfirmation} aria-describedby={errors.passwordConfirmation ? 'register-confirmation-error' : undefined} /><button className="password-toggle" type="button" aria-label={showConfirmation ? 'Şifre tekrarını gizle' : 'Şifre tekrarını göster'} aria-pressed={showConfirmation} onClick={() => setShowConfirmation((visible) => !visible)}>{showConfirmation ? 'Gizle' : 'Göster'}</button></div>
              {errors.passwordConfirmation && <span className="field-error" id="register-confirmation-error">{errors.passwordConfirmation}</span>}
            </div>
            <button className="button button-primary auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Hesap oluşturuluyor…' : 'Hesap oluştur'}
            </button>
          </form>
          <p className="auth-switch">Zaten hesabın var mı? <Link to="/login">Giriş yap</Link></p>
        </>
      )}
    </AuthLayout>
  )
}
