import { Link } from 'react-router-dom'

export function ServicesSection() {
  return (
    <section className="services-section" id="hizmetler" aria-labelledby="services-title">
      <div className="section-wrap">
        <div className="section-heading services-heading">
          <div><p className="eyebrow">Başlamak için ilham</p><h2 id="services-title">İhtiyacına uygun bir hizmet bul.</h2></div>
          <p>Güncel hizmetleri incele ve sana uygun seçenek için randevu talebi oluştur.</p>
        </div>
        <div className="services-preview-empty">
          <p>Güncel hizmetleri görüntüle ve sana uygun olanı seç.</p>
          <Link className="button button-primary" to="/hizmetler">Tüm hizmetleri gör</Link>
        </div>
      </div>
    </section>
  )
}
