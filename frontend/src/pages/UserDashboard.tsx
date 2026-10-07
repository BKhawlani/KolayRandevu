import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiRequestError, apiRequest, apiRequestWithStatus } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Navbar } from '../components/Navbar'

interface Service {
  id: number
  name: string
  description: string | null
}

interface Appointment {
  id: number
  service_id: number
  service_name: string
  appointment_date: string
  appointment_time: string
  description: string | null
  status: 'beklemede' | 'onaylandi' | 'reddedildi' | 'tamamlandi'
}

const statusLabels: Record<Appointment['status'], string> = {
  beklemede: 'Beklemede',
  onaylandi: 'Onaylandı',
  reddedildi: 'Reddedildi',
  tamamlandi: 'Tamamlandı',
}

function requestMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiRequestError)) return fallback
  if (error.status === 0) return 'Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.'
  if (error.status === 400) return 'Gönderdiğin bilgileri kontrol edip tekrar dene.'
  if (error.status === 401) return 'Oturum doğrulanamadı. Yeniden giriş yapıp tekrar dene.'
  if (error.status === 403) return 'Bu işlem için hesabının yetkisi bulunmuyor.'
  if (error.status === 404) return 'Seçilen hizmet bulunamadı. Hizmet listesini yenileyip tekrar seç.'
  if (error.status >= 500) return 'Sunucuda bir sorun oluştu. Biraz sonra tekrar dene.'
  return fallback
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function isValidTime(value: string): boolean {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return false
  return true
}

export function UserDashboard() {
  const { user, token } = useAuth()
  const [searchParams] = useSearchParams()
  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [servicesError, setServicesError] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(true)
  const [appointmentsError, setAppointmentsError] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState(() => searchParams.get('serviceId') ?? '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  const loadServices = useCallback(async () => {
    setServicesLoading(true)
    setServicesError('')
    try {
      const result = await apiRequest<{ services: Service[] }>('/services')
      setServices(result.services)
    } catch (error) {
      setServicesError(requestMessage(error, 'Hizmetler yüklenemedi.'))
    } finally {
      setServicesLoading(false)
    }
  }, [])

  const loadAppointments = useCallback(async () => {
    if (!token) return
    setAppointmentsLoading(true)
    setAppointmentsError('')
    try {
      const result = await apiRequest<{ appointments: Appointment[] }>('/appointments/me', { token })
      setAppointments(result.appointments)
    } catch (error) {
      setAppointmentsError(requestMessage(error, 'Randevu geçmişi yüklenemedi.'))
    } finally {
      setAppointmentsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (user?.role === 'kullanici') void loadServices()
    else setServicesLoading(false)
  }, [loadServices, user?.role])
  useEffect(() => {
    if (user?.role === 'kullanici') void loadAppointments()
    else setAppointmentsLoading(false)
  }, [loadAppointments, user?.role])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return
    setSuccess('')
    setFormError('')
    const serviceId = Number(selectedServiceId)
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      setFormError('Devam etmek için bir hizmet seç.')
      return
    }
    if (!isValidDate(date)) {
      setFormError('Geçerli bir tarih seç. Tarih YYYY-AA-GG biçiminde olmalı.')
      return
    }
    if (!isValidTime(time)) {
      setFormError('Geçerli bir saat seç. Saat 24 saat biçiminde olmalı.')
      return
    }
    if (description.length > 1000) {
      setFormError('Açıklama en fazla 1000 karakter olabilir.')
      return
    }
    if (!token) {
      setFormError('Oturum bulunamadı. Yeniden giriş yapıp tekrar dene.')
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    try {
      const { data, status } = await apiRequestWithStatus<{ appointment: Appointment }>('/appointments', {
        method: 'POST',
        token,
        body: {
          service_id: serviceId,
          appointment_date: date,
          appointment_time: time,
          description,
        },
      })
      if (status !== 201 || !data.appointment || !Number.isInteger(data.appointment.id)) {
        throw new Error('Sunucu randevunun oluşturulduğunu doğrulayamadı. Lütfen geçmişini kontrol et.')
      }
      setSelectedServiceId('')
      setDate('')
      setTime('')
      setDescription('')
      await loadAppointments()
      setSuccess('Randevu talebiniz başarıyla oluşturuldu.')
    } catch (error) {
      setFormError(requestMessage(error, error instanceof Error ? error.message : 'Randevu talebi oluşturulamadı.'))
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  if (user && user.role !== 'kullanici') {
    const roleLabel = user.role === 'hizmetci' ? 'Hizmet sağlayıcı' : 'Yönetici'
    const heading = user.role === 'hizmetci' ? 'Hizmet sağlayıcı paneline geç.' : 'Yönetici paneli henüz hazır değil.'
    return (
      <>
        <Navbar />
        <main className="dashboard-shell">
        <section className="role-notice" aria-labelledby="role-notice-title">
          <p className="eyebrow">{roleLabel} hesabı</p>
          <h1 id="role-notice-title">{heading}</h1>
          <p>{user.role === 'hizmetci' ? 'Randevu taleplerini hizmet sağlayıcı panelinden yönetebilirsin.' : 'Bu hesap türü için henüz bir panel sunulmuyor.'}</p>
          <Link className="button button-primary" to={user.role === 'hizmetci' ? '/provider-dashboard' : '/'}>{user.role === 'hizmetci' ? 'Hizmet sağlayıcı paneline git' : 'Ana sayfaya dön'}</Link>
        </section>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="dashboard-shell">
      <section className="dashboard-intro" aria-labelledby="dashboard-title">
        <p className="eyebrow">Müşteri paneli</p>
        <h1 id="dashboard-title">Merhaba, {user?.name}.</h1>
        <p>Hizmet seç, randevu talebini gönder ve durumunu buradan takip et.</p>
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-card appointment-card" aria-labelledby="appointment-form-title">
          <div className="section-heading">
            <div><p className="eyebrow">Yeni talep</p><h2 id="appointment-form-title">Randevu oluştur</h2></div>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <fieldset className="service-picker" disabled={submitting}>
              <legend>Hizmet seç <span aria-hidden="true">*</span></legend>
              {servicesLoading && <p className="inline-state" role="status">Hizmetler yükleniyor…</p>}
              {servicesError && <div className="inline-error" role="alert"><p>{servicesError}</p><button type="button" className="text-button" onClick={() => void loadServices()}>Tekrar dene</button></div>}
              {!servicesLoading && !servicesError && services.length === 0 && <p className="inline-state">Henüz hizmet eklenmemiş.</p>}
              {!servicesLoading && !servicesError && services.length > 0 && (
                <div className="service-options">
                  {services.map((service) => (
                    <label className={`service-option${selectedServiceId === String(service.id) ? ' is-selected' : ''}`} key={service.id}>
                      <input type="radio" name="service_id" value={service.id} checked={selectedServiceId === String(service.id)} onChange={() => { setSelectedServiceId(String(service.id)); setFormError(''); setSuccess('') }} />
                      <span className="service-option-copy"><strong>{service.name}</strong><span>{service.description || 'Hizmet açıklaması eklenmemiş.'}</span></span>
                    </label>
                  ))}
                </div>
              )}
              {selectedServiceId && <button className="text-button clear-service" type="button" onClick={() => setSelectedServiceId('')}>Hizmet seçimini temizle</button>}
            </fieldset>
            <div className="form-row">
              <div className="dashboard-field"><label htmlFor="appointment-date">Tarih <span aria-hidden="true">*</span></label><input id="appointment-date" type="date" value={date} onChange={(event) => { setDate(event.target.value); setFormError(''); setSuccess('') }} required disabled={submitting} /></div>
              <div className="dashboard-field"><label htmlFor="appointment-time">Saat <span aria-hidden="true">*</span></label><input id="appointment-time" type="time" value={time} onChange={(event) => { setTime(event.target.value); setFormError(''); setSuccess('') }} required disabled={submitting} /></div>
            </div>
            <div className="dashboard-field"><label htmlFor="appointment-description">Açıklama <span className="optional-label">(isteğe bağlı)</span></label><textarea id="appointment-description" rows={4} maxLength={1000} value={description} onChange={(event) => { setDescription(event.target.value); setFormError(''); setSuccess('') }} disabled={submitting} aria-describedby="description-count" /><span id="description-count" className="character-count">{description.length}/1000</span></div>
            {formError && <p className="form-feedback error-feedback" role="alert">{formError}</p>}
            {success && <p className="form-feedback success-feedback" role="status">{success}</p>}
            <button className="button button-primary submit-appointment" type="submit" disabled={submitting || servicesLoading || Boolean(servicesError) || services.length === 0}>
              {submitting ? 'Gönderiliyor…' : 'Randevu talebi gönder'}
            </button>
          </form>
        </section>

        <section className="dashboard-card history-card" aria-labelledby="appointment-history-title">
          <div className="section-heading"><div><p className="eyebrow">Taleplerim</p><h2 id="appointment-history-title">Randevu geçmişi</h2></div></div>
          {appointmentsLoading && <p className="inline-state" role="status">Randevular yükleniyor…</p>}
          {appointmentsError && <div className="inline-error" role="alert"><p>{appointmentsError}</p><button type="button" className="text-button" onClick={() => void loadAppointments()}>Tekrar dene</button></div>}
          {!appointmentsLoading && !appointmentsError && appointments.length === 0 && <div className="empty-history"><span className="empty-history-icon" aria-hidden="true">○</span><h3>Henüz randevu talebin yok</h3><p>Oluşturduğun talepler burada görünecek.</p></div>}
          {!appointmentsLoading && !appointmentsError && appointments.length > 0 && (
            <ul className="appointment-list">
              {appointments.map((appointment) => (
                <li className="appointment-item" key={appointment.id}>
                  <div className="appointment-item-heading"><h3>{appointment.service_name}</h3><span className={`status-pill status-${appointment.status}`}>{statusLabels[appointment.status]}</span></div>
                  <p className="appointment-datetime">{appointment.appointment_date} <span aria-hidden="true">·</span> {appointment.appointment_time}</p>
                  {appointment.description && <p className="appointment-description">{appointment.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      </main>
    </>
  )
}
