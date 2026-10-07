import { Link } from 'react-router-dom'

const footerLinks = [
  { href: '#nasil-calisir', label: 'Nasıl çalışır?' },
  { href: '#hizmetler', label: 'Hizmetler' },
  { href: '/login', label: 'Giriş yap' },
  { href: '/register', label: 'Hesap oluştur' },
]

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="section-wrap footer-main">
        <div className="footer-about">
          <Link className="brand brand-footer" to="/">
            <span className="brand-mark" aria-hidden="true"><span /></span>
            <span>kolay<span className="brand-strong">randevu</span></span>
          </Link>
          <p>Randevu taleplerini kolayca iletmen ve takip etmen için tasarlanmış sade bir platform.</p>
        </div>
        <nav className="footer-links" aria-label="Alt bilgi navigasyonu">
          {footerLinks.map((link) => link.href.startsWith('/')
            ? <Link key={link.href + link.label} to={link.href}>{link.label}</Link>
            : <a key={link.href + link.label} href={link.href}>{link.label}</a>)}
        </nav>
      </div>
      <div className="section-wrap footer-bottom">
        <span>© 2026 KolayRandevu</span>
        <span>Randevu planlamanın kolay yolu.</span>
      </div>
    </footer>
  )
}
