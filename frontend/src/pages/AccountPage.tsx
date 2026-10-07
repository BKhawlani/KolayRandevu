import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiRequestError, apiRequest, apiRequestWithStatus } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { AuthUser } from '../auth/types'
import { Navbar } from '../components/Navbar'
import { hasStrongPassword, strongPasswordMessage } from '../auth/password'

interface Profile extends AuthUser {
  created_at: string
}

const roleNames = { kullanici: 'Kullanıcı', hizmetci: 'Hizmet sağlayıcı', admin: 'Yönetici' }

function displayDate(value: string): string {
  const date = new Date(value.replace(' ', 'T') + (value.endsWith('Z') ? '' : 'Z'))
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('tr-TR')
}

export function AccountPage() {
  const { token, updateUser } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const lock = useRef(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const passwordLock = useRef(false)

  const loadProfile = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const result = await apiRequest<{ user: Profile }>('/auth/me', { token })
      setProfile(result.user)
      setName(result.user.name)
      setEmail(result.user.email)
      updateUser(result.user)
    } catch (cause) {
      setError(cause instanceof ApiRequestError && cause.status === 0
        ? 'Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.'
        : 'Hesap bilgileri yüklenemedi. Yeniden deneyebilirsin.')
    } finally {
      setLoading(false)
    }
  }, [token, updateUser])

  useEffect(() => { void loadProfile() }, [loadProfile])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (lock.current || !token) return
    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()
    if (normalizedName.length < 2 || normalizedName.length > 100) {
      setError('Ad 2 ile 100 karakter arasında olmalı.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
      setError('Geçerli bir e-posta adresi gir.')
      return
    }
    lock.current = true
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const { data, status } = await apiRequestWithStatus<{ user: Profile }>('/auth/me', {
        method: 'PATCH', token, body: { name: normalizedName, email: normalizedEmail },
      })
      if (status !== 200 || !data.user || data.user.id !== profile?.id) throw new Error('Hesap değişikliği doğrulanamadı.')
      setProfile(data.user)
      setName(data.user.name)
      setEmail(data.user.email)
      updateUser(data.user)
      setSuccess('Hesap bilgilerin güncellendi.')
    } catch (cause) {
      if (cause instanceof ApiRequestError && cause.status === 409) setError('Bu e-posta adresi başka bir hesapta kullanılıyor.')
      else if (cause instanceof ApiRequestError && cause.status === 401) setError('Oturumun sona ermiş. Yeniden giriş yap.')
      else if (cause instanceof ApiRequestError && cause.status === 0) setError('Sunucuya ulaşılamadı. Değişikliklerin kaydedilmedi; tekrar dene.')
      else if (cause instanceof ApiRequestError && cause.status >= 500) setError('Sunucuda sorun oluştu. Değişikliklerin kaydedilmedi; tekrar dene.')
      else setError(cause instanceof Error ? cause.message : 'Hesap güncellenemedi.')
    } finally {
      lock.current = false
      setSubmitting(false)
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (passwordLock.current || !token) return
    setPasswordError('')
    setPasswordSuccess('')
    if (!currentPassword) {
      setPasswordError('Mevcut şifreni gir.')
      return
    }
    if (!hasStrongPassword(newPassword)) {
      setPasswordError(strongPasswordMessage)
      return
    }
    if (newPassword !== newPasswordConfirmation) {
      setPasswordError('Yeni şifreler eşleşmiyor.')
      return
    }

    passwordLock.current = true
    setPasswordSubmitting(true)
    try {
      const { data, status } = await apiRequestWithStatus<{ message: string }>('/auth/me/password', {
        method: 'PATCH', token, body: { current_password: currentPassword, new_password: newPassword },
      })
      if (status !== 200 || !data.message) throw new Error('Şifre değişikliği doğrulanamadı.')
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirmation('')
      setPasswordSuccess('Şifren başarıyla güncellendi.')
    } catch (cause) {
      if (cause instanceof ApiRequestError && cause.code === 'current_password_incorrect') setPasswordError('Mevcut şifren hatalı.')
      else if (cause instanceof ApiRequestError && cause.status === 401) setPasswordError('Oturumun sona ermiş. Yeniden giriş yap.')
      else if (cause instanceof ApiRequestError && cause.status === 0) setPasswordError('Sunucuya ulaşılamadı. Şifren değiştirilmedi; tekrar dene.')
      else if (cause instanceof ApiRequestError && cause.status >= 500) setPasswordError('Sunucuda sorun oluştu. Şifren değiştirilmedi; tekrar dene.')
      else setPasswordError(cause instanceof Error ? cause.message : 'Şifre güncellenemedi.')
    } finally {
      passwordLock.current = false
      setPasswordSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="account-page" id="main-content">
        <section className="account-card" aria-labelledby="account-title">
          <p className="eyebrow">Profil ayarları</p>
          <h1 id="account-title">Hesabım</h1>
          {loading && <p role="status" className="inline-state">Hesap bilgileri yükleniyor…</p>}
          {error && <p role="alert" className="form-feedback error-feedback">{error}</p>}
          {!loading && !profile && <button className="button button-outline" type="button" onClick={() => void loadProfile()}>Tekrar dene</button>}
          {!loading && profile && (
            <>
              <dl className="account-readonly">
                <div><dt>Hesap türü</dt><dd>{roleNames[profile.role]}</dd></div>
                <div><dt>Hesap oluşturma tarihi</dt><dd>{displayDate(profile.created_at)}</dd></div>
              </dl>
              <form className="account-form" onSubmit={save} noValidate>
                <div className="form-field"><label htmlFor="account-name">Ad soyad</label><input id="account-name" autoComplete="name" maxLength={100} value={name} onChange={(event) => { setName(event.target.value); setError(''); setSuccess('') }} disabled={submitting} required /></div>
                <div className="form-field"><label htmlFor="account-email">E-posta</label><input id="account-email" type="email" inputMode="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => { setEmail(event.target.value); setError(''); setSuccess('') }} disabled={submitting} required /></div>
                {success && <p role="status" className="form-feedback success-feedback">{success}</p>}
                <button className="button button-primary auth-submit" type="submit" disabled={submitting}>{submitting ? 'Kaydediliyor…' : 'Değişiklikleri kaydet'}</button>
              </form>
              <section className="account-password-section" aria-labelledby="password-title">
                <h2 id="password-title">Şifre değiştir</h2>
                <p>Hesabının güvenliği için önce mevcut şifreni doğrula.</p>
                <form className="account-form" onSubmit={changePassword} noValidate>
                  <div className="form-field">
                    <label htmlFor="current-password">Mevcut şifre</label>
                    <div className="password-input-wrap">
                      <input id="current-password" type={showCurrentPassword ? 'text' : 'password'} autoComplete="current-password" value={currentPassword} onChange={(event) => { setCurrentPassword(event.target.value); setPasswordError(''); setPasswordSuccess('') }} disabled={passwordSubmitting} required />
                      <button className="password-toggle" type="button" aria-label={showCurrentPassword ? 'Mevcut şifreyi gizle' : 'Mevcut şifreyi göster'} aria-pressed={showCurrentPassword} onClick={() => setShowCurrentPassword((shown) => !shown)}>{showCurrentPassword ? 'Gizle' : 'Göster'}</button>
                    </div>
                  </div>
                  <div className="form-field">
                    <label htmlFor="new-password">Yeni şifre</label>
                    <div className="password-input-wrap">
                      <input id="new-password" type={showNewPassword ? 'text' : 'password'} autoComplete="new-password" value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setPasswordError(''); setPasswordSuccess('') }} aria-describedby="new-password-help" disabled={passwordSubmitting} required />
                      <button className="password-toggle" type="button" aria-label={showNewPassword ? 'Yeni şifreyi gizle' : 'Yeni şifreyi göster'} aria-pressed={showNewPassword} onClick={() => setShowNewPassword((shown) => !shown)}>{showNewPassword ? 'Gizle' : 'Göster'}</button>
                    </div>
                    <span id="new-password-help" className="field-help">{strongPasswordMessage}</span>
                  </div>
                  <div className="form-field">
                    <label htmlFor="new-password-confirmation">Yeni şifre tekrar</label>
                    <div className="password-input-wrap">
                      <input id="new-password-confirmation" type={showPasswordConfirmation ? 'text' : 'password'} autoComplete="new-password" value={newPasswordConfirmation} onChange={(event) => { setNewPasswordConfirmation(event.target.value); setPasswordError(''); setPasswordSuccess('') }} disabled={passwordSubmitting} required />
                      <button className="password-toggle" type="button" aria-label={showPasswordConfirmation ? 'Yeni şifre tekrarını gizle' : 'Yeni şifre tekrarını göster'} aria-pressed={showPasswordConfirmation} onClick={() => setShowPasswordConfirmation((shown) => !shown)}>{showPasswordConfirmation ? 'Gizle' : 'Göster'}</button>
                    </div>
                  </div>
                  {passwordError && <p role="alert" className="form-feedback error-feedback">{passwordError}</p>}
                  {passwordSuccess && <p role="status" className="form-feedback success-feedback">{passwordSuccess}</p>}
                  <button className="button button-primary auth-submit" type="submit" disabled={passwordSubmitting}>{passwordSubmitting ? 'Güncelleniyor…' : 'Şifreyi güncelle'}</button>
                </form>
              </section>
            </>
          )}
        </section>
      </main>
    </>
  )
}
