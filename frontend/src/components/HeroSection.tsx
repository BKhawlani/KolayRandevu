import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
export function HeroSection() {

  const { isAuthenticated } = useAuth()

  return (
    <section className="hero section-wrap" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-dot" /> Randevu planlamanın kolay yolu</p>
        <h1 id="hero-title">Randevu ayarlamak,<br className="desktop-break" /> bu kadar zor olmamalı.</h1>
        <p className="hero-description">
          İhtiyacın olan hizmeti bul, talebini tek yerden ilet. Telefon trafiği olmadan,
          planın netleşsin.
        </p>
        <div className="hero-actions">
          <Link
  className="button button-primary"
  to={isAuthenticated ? "/dashboard" : "/login"}
>
  Randevu talebi oluştur <span aria-hidden="true">↗</span>
</Link>
          <a className="text-link" href="#nasil-calisir">Nasıl çalışır? <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-note">
          <span className="note-check" aria-hidden="true">✓</span>
          <span>Talebin ve güncellemeler tek yerde.</span>
        </div>
      </div>

      <div className="hero-art" aria-hidden="true">
        <div className="art-orbit orbit-one" />
        <div className="art-orbit orbit-two" />
        <div className="appointment-preview">
          <div className="preview-topline">
            <span className="preview-brand"><span className="brand-mark brand-mark-small"><span /></span> kolayrandevu</span>
            <span className="preview-menu">•••</span>
          </div>
          <div className="preview-greeting">
            <span className="preview-kicker">RANDEVU TALEBİN</span>
            <span className="preview-status"><i /> İletildi</span>
          </div>
          <div className="preview-service-icon" aria-hidden="true">✳</div>
          <h2>İlk danışmanlık<br />görüşmesi</h2>
          <p className="preview-subtitle">Uzmanlık & danışmanlık</p>
          <div className="preview-divider" />
          <div className="preview-detail">
            <span className="detail-icon" aria-hidden="true">▦</span>
            <span><small>Tarih</small><strong>Perşembe, 10:30</strong></span>
          </div>
          <div className="preview-detail">
            <span className="detail-icon detail-icon-place" aria-hidden="true">⌖</span>
            <span><small>Durum</small><strong>Yanıt bekleniyor</strong></span>
          </div>
          <div className="preview-progress"><span /></div>
          <p className="preview-footnote">Durum değişince burada göreceksin.</p>
        </div>
        <div className="floating-note"><span className="floating-check">✓</span><span><strong>Hepsi tek yerde</strong><small>Basit ve düzenli</small></span></div>
        <div className="art-sparkle sparkle-one">✳</div>
        <div className="art-sparkle sparkle-two">✳</div>
      </div>
    </section>
  )
}
