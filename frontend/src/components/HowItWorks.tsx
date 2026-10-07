const steps = [
  { number: '01', title: 'Hizmet seç', description: 'İhtiyacına uygun hizmeti bul ve detaylarına göz at.' },
  { number: '02', title: 'Talep gönder', description: 'Sana uyan tarih ve saati seçip talebini ilet.' },
  { number: '03', title: 'Durumunu takip et', description: 'Talebinin güncel durumunu hesabından kontrol et.' },
]

export function HowItWorks() {
  return (
    <section className="steps-section section-wrap" id="nasil-calisir" aria-labelledby="steps-title">
      <div className="section-heading">
        <p className="eyebrow">Üç kolay adım</p>
        <h2 id="steps-title">İşin özü bu kadar basit.</h2>
        <p>İhtiyacını seç, talebini gönder, gerisini kolayca takip et.</p>
      </div>
      <div className="steps-grid">
        {steps.map((step, index) => (
          <article className="step-card" key={step.number}>
            <div className="step-top"><span>{step.number}</span>{index < steps.length - 1 && <i aria-hidden="true" />}</div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
