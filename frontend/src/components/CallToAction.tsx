import { Link } from 'react-router-dom'

export function CallToAction() {
  return (
    <section className="cta-section section-wrap" id="kayit" aria-labelledby="cta-title">
      <div className="cta-panel">
        <div className="cta-decoration" aria-hidden="true"><span /><span /><span /></div>
        <div className="cta-copy">
          <p className="eyebrow eyebrow-light">Planlarını kolaylaştır</p>
          <h2 id="cta-title">Bir sonraki randevun<br className="desktop-break" /> daha kolay olsun.</h2>
          <p>KolayRandevu’ya katıl, taleplerini tek yerden oluşturup takip et.</p>
        </div>
        <Link className="button button-light" to="/register">Hemen hesap oluştur <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  )
}
