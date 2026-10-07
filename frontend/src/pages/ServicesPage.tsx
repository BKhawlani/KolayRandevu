import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiRequestError, apiRequest } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Navbar } from '../components/Navbar'

interface Service {
  id: number
  name: string
  description: string | null
}

export function ServicesPage() {
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadServices = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await apiRequest<{ services: Service[] }>('/services')
      setServices(result.services)
    } catch (cause) {
      setError(cause instanceof ApiRequestError && cause.status === 0
        ? 'Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.'
        : 'Hizmetler şu anda yüklenemiyor. Lütfen yeniden dene.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadServices() }, [loadServices])

  function bookingPath(serviceId: number): string {
    if (user?.role === 'hizmetci') return '/provider-dashboard'
    if (user?.role === 'admin') return '/admin'
    const appointmentPath = `/dashboard?serviceId=${serviceId}`
    return user ? appointmentPath : `/login?next=${encodeURIComponent(appointmentPath)}`
  }

  const actionLabel = user?.role === 'hizmetci' ? 'Panele git' : user?.role === 'admin' ? 'Admin paneline git' : 'Randevu Al'

  return (
    <>
      <Navbar />
      <main className="services-page" id="main-content">
        <section className="services-page-intro" aria-labelledby="services-page-title">
          <p className="eyebrow">KolayRandevu hizmetleri</p>
          <h1 id="services-page-title">İhtiyacına uygun hizmeti seç.</h1>
          <p>Bir hizmet seç, uygun tarih ve saat için randevu talebini ilet.</p>
          <p className="demo-disclaimer">Listelenen hizmet adları kurgusal demo verileridir; gerçek sağlık veya danışmanlık hizmeti sunulmaz.</p>
        </section>
        <section className="public-services-section" aria-label="Mevcut hizmetler">
          {loading && <p className="inline-state" role="status">Hizmetler yükleniyor…</p>}
          {error && <div className="inline-error" role="alert"><p>{error}</p><button type="button" className="text-button" onClick={() => void loadServices()}>Tekrar dene</button></div>}
          {!loading && !error && services.length === 0 && <div className="empty-history"><h2>Henüz listelenecek hizmet yok</h2><p>Yeni hizmetler eklendiğinde burada görünecek.</p></div>}
          {!loading && !error && services.length > 0 && (
            <ul className="public-service-grid">
              {services.map((service) => (
                <li className="public-service-card" key={service.id}>
                  <div className="public-service-mark" aria-hidden="true">✳</div>
                  <h2>{service.name}</h2>
                  <p>{service.description || 'Bu hizmet için henüz açıklama eklenmemiş.'}</p>
                  <Link className="button button-primary" to={bookingPath(service.id)}>{actionLabel}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  )
}
