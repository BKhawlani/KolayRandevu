import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiRequestError, apiRequest, apiRequestWithStatus } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Navbar } from '../components/Navbar'

interface ProviderAppointment {
  id: number
  customer_name: string
  customer_email: string
  service_id: number
  service_name: string
  appointment_date: string
  appointment_time: string
  description: string | null
  status: 'beklemede' | 'onaylandi' | 'reddedildi' | 'tamamlandi'
  created_at: string
}

type Decision = 'onaylandi' | 'reddedildi'

const statusLabels: Record<ProviderAppointment['status'], string> = {
  beklemede: 'Beklemede',
  onaylandi: 'Onaylandı',
  reddedildi: 'Reddedildi',
  tamamlandi: 'Tamamlandı',
}

function friendlyError(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 0) return 'Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.'
    if (error.status === 401) return 'Oturumun doğrulanamadı. Yeniden giriş yap.'
    if (error.status === 403) return 'Bu sayfaya erişmek için hizmet sağlayıcı hesabı gerekli.'
    if (error.status === 400) return 'İşlem bilgisi geçersiz. Sayfayı yenileyip tekrar dene.'
    if (error.status === 404) return 'Randevu bulunamadı veya artık bu hizmete ait değil. Listeyi yenile.'
    if (error.status === 409) return 'Bu randevu daha önce işlenmiş. Listeyi yenileyip durumunu kontrol et.'
    if (error.status >= 500) return 'Sunucuda bir sorun oluştu. Biraz sonra tekrar dene.'
    return error.message || fallback
  }
  return error instanceof Error ? error.message : fallback
}

export function ProviderDashboard() {
  const { user, token } = useAuth()
  const [appointments, setAppointments] = useState<ProviderAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const busyRef = useRef(false)

  const loadAppointments = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setLoadError('')
    try {
      const result = await apiRequest<{ appointments: ProviderAppointment[] }>('/provider/appointments', { token })
      setAppointments(result.appointments)
    } catch (error) {
      setLoadError(friendlyError(error, 'Randevu talepleri yüklenemedi.'))
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (user?.role === 'hizmetci') void loadAppointments()
    else setLoading(false)
  }, [loadAppointments, user?.role])

  async function updateStatus(appointment: ProviderAppointment, status: Decision) {
    if (busyRef.current || !token) return
    busyRef.current = true
    setBusyId(appointment.id)
    setActionError('')
    setActionSuccess('')
    try {
      const { data, status: httpStatus } = await apiRequestWithStatus<{ appointment: ProviderAppointment }>(
        `/provider/appointments/${appointment.id}/status`,
        { method: 'PATCH', token, body: { status } },
      )
      if (httpStatus !== 200 || data.appointment?.id !== appointment.id || data.appointment.status !== status) {
        throw new Error('Sunucu randevu durumunu doğrulayamadı. Listeyi yenileyip tekrar kontrol et.')
      }
      setAppointments((current) => current.map((item) => item.id === appointment.id ? data.appointment : item))
      setActionSuccess(`${appointment.service_name} için talep ${statusLabels[status].toLocaleLowerCase('tr-TR')} olarak güncellendi.`)
    } catch (error) {
      setActionError(friendlyError(error, 'Randevu durumu güncellenemedi.'))
    } finally {
      busyRef.current = false
      setBusyId(null)
    }
  }

  if (user && user.role !== 'hizmetci') {
    const dashboard = user.role === 'kullanici' ? '/dashboard' : '/'
    const accountLabel = user.role === 'kullanici' ? 'Kullanıcı' : 'Yönetici'
    return (
      <><Navbar /><main className="dashboard-shell">
        <section className="role-notice" aria-labelledby="provider-role-title">
          <p className="eyebrow">{accountLabel} hesabı</p>
          <h1 id="provider-role-title">Bu panel hizmet sağlayıcılar içindir.</h1>
          <p>Bu hesap türü bu paneli kullanamaz.</p>
          <Link className="button button-primary" to={dashboard}>{user.role === 'kullanici' ? 'Kullanıcı paneline git' : 'Ana sayfaya dön'}</Link>
        </section>
      </main></>
    )
  }

  return (
    <><Navbar /><main className="dashboard-shell">
      <nav className="dashboard-shortcuts" aria-label="Hızlı bağlantılar"><Link to="/hizmetler">Hizmetler</Link><Link to="/hesabim">Hesabım</Link></nav>
      <section className="dashboard-intro" aria-labelledby="provider-dashboard-title">
        <p className="eyebrow">Hizmet sağlayıcı paneli</p>
        <h1 id="provider-dashboard-title">Randevu talepleri</h1>
        <p>Hizmetlerin için gelen talepleri incele ve durumlarını güncelle.</p>
        <span className="user-email">{user?.email}</span>
      </section>

      <section className="dashboard-card provider-appointments-card" aria-labelledby="provider-appointments-heading">
        <div className="section-heading provider-section-heading">
          <div><p className="eyebrow">Gelen kutusu</p><h2 id="provider-appointments-heading">Talepler</h2></div>
          {!loading && !loadError && <span className="request-count">{appointments.length} talep</span>}
        </div>
        {loading && <p className="inline-state" role="status">Randevu talepleri yükleniyor…</p>}
        {loadError && <div className="inline-error" role="alert"><p>{loadError}</p><button type="button" className="text-button" onClick={() => void loadAppointments()}>Tekrar dene</button></div>}
        {actionError && <p className="form-feedback error-feedback" role="alert">{actionError}</p>}
        {actionSuccess && <p className="form-feedback success-feedback" role="status">{actionSuccess}</p>}
        {!loading && !loadError && appointments.length === 0 && (
          <div className="empty-history"><span className="empty-history-icon" aria-hidden="true">○</span><h3>Henüz randevu talebi yok</h3><p>Hizmetlerin için gelen yeni talepler burada görünecek.</p></div>
        )}
        {!loading && !loadError && appointments.length > 0 && (
          <ul className="provider-appointment-list">
            {appointments.map((appointment) => {
              const updating = busyId === appointment.id
              return (
                <li className="provider-appointment-item" key={appointment.id}>
                  <div className="provider-appointment-main">
                    <div className="appointment-item-heading">
                      <div><p className="provider-service-name">{appointment.service_name}</p><h3>{appointment.customer_name}</h3></div>
                      <span className={`status-pill status-${appointment.status}`}>{statusLabels[appointment.status]}</span>
                    </div>
                    <a className="provider-customer-email" href={`mailto:${appointment.customer_email}`}>{appointment.customer_email}</a>
                    <p className="appointment-datetime">{appointment.appointment_date} <span aria-hidden="true">·</span> {appointment.appointment_time}</p>
                    {appointment.description && <p className="appointment-description">{appointment.description}</p>}
                    <p className="provider-created-date">Talep tarihi: {appointment.created_at}</p>
                    {appointment.status === 'beklemede' && (
                      <div className="provider-actions" aria-label={`${appointment.customer_name} randevu talebi işlemleri`}>
                        <button className="button button-primary provider-action-button" type="button" onClick={() => void updateStatus(appointment, 'onaylandi')} disabled={busyRef.current} aria-label={`${appointment.customer_name} talebini onayla`}>
                          {updating ? 'Güncelleniyor…' : 'Onayla'}
                        </button>
                        <button className="button provider-reject-button" type="button" onClick={() => void updateStatus(appointment, 'reddedildi')} disabled={busyRef.current} aria-label={`${appointment.customer_name} talebini reddet`}>Reddet</button>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main></>
  )
}
