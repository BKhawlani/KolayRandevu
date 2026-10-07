import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiRequestError, apiRequest, apiRequestWithStatus } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Navbar } from '../components/Navbar'

interface AdminUser { id: number; name: string; email: string; role: 'kullanici' | 'hizmetci' | 'admin'; created_at: string }
interface AdminService { id: number; name: string; description: string | null; provider_id: number; created_at: string }
interface AdminAppointment {
  id: number
  user_id: number
  service_id: number
  appointment_date: string
  appointment_time: string
  description: string | null
  status: 'beklemede' | 'onaylandi' | 'reddedildi' | 'tamamlandi'
  created_at: string
  service_name: string
  user_name: string
  user_email: string
}
const roleLabels = { kullanici: 'Kullanıcı', hizmetci: 'Hizmet sağlayıcı', admin: 'Yönetici' }

export function AdminPage() {
  const { user, token } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [services, setServices] = useState<AdminService[]>([])
  const [appointments, setAppointments] = useState<AdminAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [busyUI, setBusyUI] = useState(false)
  const busy = useRef(false)

  const loadAdminData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setPageError('')
    try {
      const [userResult, serviceResult, appointmentResult] = await Promise.all([
        apiRequest<{ users: AdminUser[] }>('/admin/users', { token }),
        apiRequest<{ services: AdminService[] }>('/admin/services', { token }),
        apiRequest<{ appointments: AdminAppointment[] }>('/admin/appointments', { token }),
      ])
      setUsers(userResult.users)
      setServices(serviceResult.services)
      setAppointments(appointmentResult.appointments)
    } catch (cause) {
      if (cause instanceof ApiRequestError && cause.status === 401) setPageError('Oturum doğrulanamadı. Yeniden giriş yap.')
      else if (cause instanceof ApiRequestError && cause.status === 403) setPageError('Bu sayfaya yalnızca yönetici hesabı erişebilir.')
      else if (cause instanceof ApiRequestError && cause.status === 0) setPageError('Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.')
      else setPageError('Yönetim verileri yüklenemedi. Tekrar deneyebilirsin.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { if (user?.role === 'admin') void loadAdminData(); else setLoading(false) }, [loadAdminData, user?.role])

  async function addService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || busy.current) return
    busy.current = true
    setBusyUI(true)
    setActionError('')
    setActionMessage('')
    try {
      const { data, status } = await apiRequestWithStatus<{ service: AdminService }>('/admin/services', {
        method: 'POST', token, body: { name, description },
      })
      if (status !== 201 || !data.service?.id) throw new Error('Hizmet ekleme sunucu tarafından doğrulanamadı.')
      setName('')
      setDescription('')
      setActionMessage('Hizmet eklendi.')
      await loadAdminData()
    } catch (cause) {
      setActionError(cause instanceof ApiRequestError && cause.status === 0 ? 'Sunucuya ulaşılamadı; hizmet eklenmedi.' : cause instanceof ApiRequestError && cause.status === 403 ? 'Bu işlem için yönetici yetkisi gerekli.' : 'Hizmet eklenemedi. Bilgileri kontrol edip tekrar dene.')
    } finally { busy.current = false; setBusyUI(false) }
  }

  function beginEdit(service: AdminService) {
    setEditingId(service.id)
    setEditName(service.name)
    setEditDescription(service.description ?? '')
    setActionError('')
    setActionMessage('')
  }

  async function saveEdit(id: number) {
    if (!token || busy.current) return
    busy.current = true
    setBusyUI(true)
    setActionError('')
    setActionMessage('')
    try {
      const { data, status } = await apiRequestWithStatus<{ service: AdminService }>(`/admin/services/${id}`, {
        method: 'PATCH', token, body: { name: editName, description: editDescription },
      })
      if (status !== 200 || data.service?.id !== id) throw new Error('Hizmet güncellemesi doğrulanamadı.')
      setServices((current) => current.map((service) => service.id === id ? data.service : service))
      setEditingId(null)
      setActionMessage('Hizmet güncellendi.')
    } catch (cause) {
      setActionError(cause instanceof ApiRequestError && cause.status === 0 ? 'Sunucuya ulaşılamadı; değişiklikler kaydedilmedi.' : 'Hizmet güncellenemedi. Bilgileri kontrol edip tekrar dene.')
    } finally { busy.current = false; setBusyUI(false) }
  }

  async function removeService(id: number) {
    if (!token || busy.current) return
    busy.current = true
    setBusyUI(true)
    setActionError('')
    setActionMessage('')
    try {
      const { status } = await apiRequestWithStatus<null>(`/admin/services/${id}`, { method: 'DELETE', token })
      if (status !== 204) throw new Error('Hizmet silme sunucu tarafından doğrulanamadı.')
      setServices((current) => current.filter((service) => service.id !== id))
      setActionMessage('Hizmet silindi.')
    } catch (cause) {
      if (cause instanceof ApiRequestError && cause.status === 409) setActionError('Bu hizmet randevularla ilişkili olduğu için silinemez.')
      else if (cause instanceof ApiRequestError && cause.status === 0) setActionError('Sunucuya ulaşılamadı; hizmet silinmedi.')
      else setActionError('Hizmet silinemedi. Listeyi yenileyip tekrar dene.')
    } finally { busy.current = false; setBusyUI(false) }
  }

  async function handleStatusChange(appointmentId: number, newStatus: AdminAppointment['status']) {
    if (!token || busy.current) return
    busy.current = true
    setBusyUI(true)
    setActionError('')
    setActionMessage('')
    try {
      const { data, status } = await apiRequestWithStatus<{ appointment: AdminAppointment }>(`/admin/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        token,
        body: { status: newStatus },
      })
      if (status !== 200 || data.appointment?.id !== appointmentId || data.appointment.status !== newStatus) {
        throw new Error('Sunucu randevu durumunu doğrulayamadı. Listeyi yenileyip tekrar kontrol et.')
      }
      setAppointments((current) => current.map((appointment) => appointment.id === appointmentId ? data.appointment : appointment))
      setActionMessage('Randevu durumu güncellendi.')
    } catch (cause) {
      if (cause instanceof ApiRequestError && cause.status === 0) setActionError('Sunucuya ulaşılamadı; durum güncellenemedi.')
      else if (cause instanceof ApiRequestError && cause.status === 403) setActionError('Bu işlem için yönetici yetkisi gerekli.')
      else if (cause instanceof ApiRequestError && cause.status === 404) setActionError('Randevu bulunamadı.')
      else if (cause instanceof ApiRequestError && cause.status === 400) setActionError('Seçilen randevu durumu geçersiz.')
      else setActionError('Randevu durumu güncellenemedi. Bilgileri kontrol edip tekrar dene.')
    } finally { busy.current = false; setBusyUI(false) }
  }

  if (user?.role !== 'admin') {
    return <><Navbar /><main className="account-page"><section className="account-card"><h1>Admin Paneli</h1><p role="alert">Bu sayfaya yalnızca yönetici hesabı erişebilir.</p><Link className="button button-primary" to={user ? '/dashboard' : '/login'}>{user ? 'Hesabıma dön' : 'Giriş yap'}</Link></section></main></>
  }

  return (
    <>
      <Navbar />
      <main className="admin-page" id="main-content">
        <section className="admin-intro"><p className="eyebrow">Yönetim</p><h1>Admin Paneli</h1><p>Kullanıcıları görüntüle ve hizmet kayıtlarını yönet.</p><p className="admin-login-hint">Demo giriş adı: <strong>engbashar</strong></p></section>
        {pageError && <div className="inline-error" role="alert"><p>{pageError}</p><button className="text-button" type="button" onClick={() => void loadAdminData()}>Tekrar dene</button></div>}
        {actionError && <p className="form-feedback error-feedback" role="alert">{actionError}</p>}
        {actionMessage && <p className="form-feedback success-feedback" role="status">{actionMessage}</p>}
        {loading && <p role="status" className="inline-state">Yönetim bilgileri yükleniyor…</p>}
        {!loading && !pageError && <>
          <section className="admin-card" aria-labelledby="admin-users-title"><div className="section-heading"><div><p className="eyebrow">Hesaplar</p><h2 id="admin-users-title">Kullanıcılar</h2></div></div>
            <div className="admin-table-wrap"><table><thead><tr><th>Ad</th><th>E-posta</th><th>Rol</th><th>Oluşturulma tarihi</th></tr></thead><tbody>{users.map((account) => <tr key={account.id}><td>{account.name}</td><td>{account.email}</td><td>{roleLabels[account.role]}</td><td>{account.created_at}</td></tr>)}</tbody></table></div>
          </section>
          <section className="admin-card" aria-labelledby="admin-services-title"><div className="section-heading"><div><p className="eyebrow">Katalog</p><h2 id="admin-services-title">Hizmetler</h2></div></div>
            <form className="admin-service-form" onSubmit={addService}><div className="form-field"><label htmlFor="admin-service-name">Hizmet adı</label><input id="admin-service-name" maxLength={120} value={name} onChange={(event) => setName(event.target.value)} required disabled={busyUI} /></div><div className="form-field"><label htmlFor="admin-service-description">Açıklama</label><textarea id="admin-service-description" maxLength={2000} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} disabled={busyUI} /></div><button className="button button-primary" type="submit" disabled={busyUI}>{busyUI ? 'İşleniyor…' : 'Hizmet ekle'}</button></form>
            <ul className="admin-service-list">{services.map((service) => <li className="admin-service-item" key={service.id}>{editingId === service.id ? <div className="admin-edit-fields"><label>Hizmet adı<input maxLength={120} value={editName} onChange={(event) => setEditName(event.target.value)} /></label><label>Açıklama<textarea maxLength={2000} rows={2} value={editDescription} onChange={(event) => setEditDescription(event.target.value)} /></label><div className="admin-row-actions"><button type="button" className="button button-primary" disabled={busyUI} onClick={() => void saveEdit(service.id)}>{busyUI ? 'İşleniyor…' : 'Kaydet'}</button><button type="button" className="button button-outline" onClick={() => setEditingId(null)} disabled={busyUI}>Vazgeç</button></div></div> : <><div><h3>{service.name}</h3><p>{service.description || 'Açıklama eklenmemiş.'}</p></div><div className="admin-row-actions"><button type="button" className="text-button" onClick={() => beginEdit(service)}>Düzenle</button><button type="button" className="text-button admin-delete" disabled={busyUI} onClick={() => void removeService(service.id)}>Sil</button></div></>}</li>)}</ul>
          </section>
          {/* ====================== NEW APPOINTMENTS SECTION ====================== */}
          <section className="admin-card" aria-labelledby="admin-appointments-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Randevular</p>
                <h2 id="admin-appointments-title">Tüm Randevular</h2>
              </div>
            </div>
            {!loading && appointments.length === 0 ? (
              <p className="inline-state">Hiç randevu bulunamadı.</p>
            ) : (
              <div className="admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Kullanıcı</th>
                      <th>E-posta</th>
                      <th>Hizmet</th>
                      <th>Tarih</th>
                      <th>Saat</th>
                      <th>Açıklama</th>
                      <th>Durum</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt) => (
                      <tr key={appt.id}>
                        <td>{appt.id}</td>
                        <td>{appt.user_name}</td>
                        <td>{appt.user_email}</td>
                        <td>{appt.service_name}</td>
                        <td>{appt.appointment_date}</td>
                        <td>{appt.appointment_time}</td>
                        <td>{appt.description ?? '-'}</td>
                        <td>
                          {/* Status badge with color coding */}
                          <span
                            className={`status-badge ${
                              appt.status === 'beklemede'
                                ? 'status-pending'
                                : appt.status === 'onaylandi'
                                ? 'status-approved'
                                : appt.status === 'reddedildi'
                                ? 'status-rejected'
                                : 'status-completed'
                            }`}
                          >
                            {appt.status === 'beklemede' ? 'Beklemede' : appt.status === 'onaylandi' ? 'Onaylandı' : appt.status === 'reddedildi' ? 'Reddedildi' : 'Tamamlandı'}
                          </span>
                        </td>
                        <td>
                          <div className="status-actions">
                            <select
                              value={appt.status}
                              aria-label={`${appt.user_name} randevu durumu`}
                              onChange={(e) => handleStatusChange(appt.id, e.target.value as AdminAppointment['status'])}
                              disabled={busyUI}
                              className="status-select"
                            >
                              <option value="beklemede">Beklemede</option>
                              <option value="onaylandi">Onaylandı</option>
                              <option value="reddedildi">Reddedildi</option>
                              <option value="tamamlandi">Tamamlandi</option>
                            </select>
                            {busyUI && <span className="busy-indicator">İşleniyor…</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          {/* ====================== END APPOINTMENTS SECTION ====================== */}
        </>}
      </main>
    </>
  )
}
