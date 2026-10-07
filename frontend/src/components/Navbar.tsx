import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

function Brand() {
  return (
    <Link className="brand" to="/" aria-label="KolayRandevu ana sayfa">
      <span className="brand-mark" aria-hidden="true"><span /></span>
      <span>kolay<span className="brand-strong">randevu</span></span>
    </Link>
  )
}

function RouteLink({ to, children }: { to: string; children: string }) {
  return <NavLink to={to} end={to === '/'} className={({ isActive }) => isActive ? 'nav-active' : undefined}>{children}</NavLink>
}

export function Navbar() {
  const { user, logout } = useAuth()
  const roleDashboard = user?.role === 'hizmetci' ? '/provider-dashboard' : user?.role === 'admin' ? '/admin' : '/dashboard'
  const roleDashboardLabel = user?.role === 'hizmetci' ? 'Randevu Talepleri' : user?.role === 'admin' ? 'Admin Paneli' : 'Randevularım'

  const routeLinks = (
    <>
      <RouteLink to="/">Ana Sayfa</RouteLink>
      <RouteLink to="/hizmetler">Hizmetler</RouteLink>
      {user && <RouteLink to={roleDashboard}>{roleDashboardLabel}</RouteLink>}
      {user && <RouteLink to="/hesabim">Hesabım</RouteLink>}
    </>
  )

  const accountActions = user ? (
    <button className="nav-logout" type="button" onClick={logout}>Çıkış Yap</button>
  ) : (
    <>
      <RouteLink to="/login">Giriş Yap</RouteLink>
      <Link className="button button-small button-dark" to="/register">Kayıt Ol</Link>
    </>
  )

  return (
    <header className="site-header" id="ana-sayfa">
      <div className="nav-shell">
        <Brand />
        <nav className="desktop-nav" aria-label="Ana gezinme">{routeLinks}</nav>
        <div className="nav-actions">{accountActions}</div>
        <details className="mobile-menu">
          <summary aria-label="Menüyü aç veya kapat"><span className="menu-icon" aria-hidden="true"><i /><i /></span><span className="sr-only">Menü</span></summary>
          <div className="mobile-menu-panel">
            <nav className="mobile-nav-links" aria-label="Mobil gezinme">{routeLinks}</nav>
            {accountActions}
          </div>
        </details>
      </div>
    </header>
  )
}
