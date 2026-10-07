import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { AuthLayout } from '../components/AuthLayout'

interface LoginValues {
  email: string
  password: string
}

type LoginErrors = Partial<Record<keyof LoginValues, string>>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [values, setValues] = useState<LoginValues>({ email: '', password: '' })
  const [errors, setErrors] = useState<LoginErrors>({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const submitLock = useRef(false)

  function updateField(field: keyof LoginValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setFormError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitLock.current) return

    const nextErrors: LoginErrors = {}
    const email = values.email.trim()
    if (!email) nextErrors.email = 'E-posta adresini veya kullanıcı adını yaz.'
    else if (email.toLowerCase() !== 'engbashar' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Geçerli bir e-posta adresi veya kullanıcı adı yaz.'
    else if (email.length > 254) nextErrors.email = 'E-posta adresi en fazla 254 karakter olabilir.'
    if (!values.password) nextErrors.password = 'Şifreni yaz.'
    else if (new TextEncoder().encode(values.password).length > 72) nextErrors.password = 'Şifre en fazla 72 UTF-8 bayt olabilir.'

    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length > 0) return

    submitLock.current = true
    setIsSubmitting(true)
    try {
      const role = await login(email.toLowerCase(), values.password)
      const requested = searchParams.get('next')
      const safeCustomerReturn = role === 'kullanici' && requested && /^\/dashboard\?serviceId=\d+$/.test(requested)
        ? requested
        : null
      const destination = role === 'hizmetci' ? '/provider-dashboard' : role === 'admin' ? '/admin' : safeCustomerReturn ?? '/dashboard'
      navigate(destination, { replace: true })
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'invalid_credentials') {
        setFormError('E-posta adresi veya şifre hatalı. Bilgilerini kontrol edip tekrar dene.')
      } else {
        setFormError(error instanceof ApiRequestError
          ? error.message
          : error instanceof Error ? error.message : 'Giriş yapılamadı. Bilgilerini kontrol edip tekrar dene.')
      }
    } finally {
      submitLock.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Tekrar hoş geldin"
      title="Planına kaldığın yerden devam et."
      description="Giriş yap, randevu taleplerini ve güncel durumlarını görüntüle."
    >
      <div className="auth-card-heading">
        <p className="eyebrow">KolayRandevu hesabın</p>
        <h2>Giriş yap</h2>
        <p>Hesabına devam etmek için bilgilerini gir.</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && <div className="form-alert" role="alert" aria-live="assertive">{formError}</div>}
        <div className="form-field">
          <label htmlFor="login-email">E-posta veya kullanıcı adı</label>
          <input id="login-email" name="email" type="email" inputMode="email" autoComplete="email" value={values.email} onChange={(event) => updateField('email', event.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'login-email-error' : undefined} />
          {errors.email && <span className="field-error" id="login-email-error">{errors.email}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="login-password">Şifre</label>
          <div className="password-input-wrap"><input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={values.password} onChange={(event) => updateField('password', event.target.value)} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'login-password-error' : undefined} /><button className="password-toggle" type="button" aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? 'Gizle' : 'Göster'}</button></div>
          {errors.password && <span className="field-error" id="login-password-error">{errors.password}</span>}
        </div>
        <button className="button button-primary auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
      </form>
      <p className="auth-switch">Henüz hesabın yok mu? <Link to="/register">Hesap oluştur</Link></p>
    </AuthLayout>
  )
}
