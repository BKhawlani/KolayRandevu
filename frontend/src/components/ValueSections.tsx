const problems = [
  { number: '01', title: 'Mesaj trafiği uzuyor', description: 'Uygun saat bulmak için aramalar ve mesajlar arasında gidip geliyorsun.' },
  { number: '02', title: 'Talepler kaybolabiliyor', description: 'Hangi hizmet için kime yazdığını ve ne zaman dönüş beklediğini takip etmek zor.' },
  { number: '03', title: 'Durum belirsiz kalıyor', description: 'Talebin görüldü mü, onaylandı mı? Cevap gelene kadar emin olamıyorsun.' },
]

const solutions = [
  { mark: '↗', title: 'Tek noktadan talep', description: 'Hizmeti seç, randevu isteğini anlaşılır bir şekilde ilet.' },
  { mark: '◎', title: 'Daha net takip', description: 'Taleplerini ve durum güncellemelerini aynı yerde gör.' },
  { mark: '⌕', title: 'Kolay hizmet seçimi', description: 'İhtiyacına uygun hizmetleri tek ekranda incele.' },
]

export function ValueSections() {
  return (
    <>
      <section className="problem-section section-wrap" id="sorun" aria-labelledby="problem-title">
        <div className="section-heading section-heading-centered">
          <p className="eyebrow">Tanıdık geliyor mu?</p>
          <h2 id="problem-title">Bir randevu için<br className="mobile-break" /> bu kadar uğraşmaya gerek yok.</h2>
          <p>Günlük planın, birkaç mesajın arasında kaybolmasın.</p>
        </div>
        <div className="problem-grid">
          {problems.map((problem) => (
            <article className="problem-card" key={problem.number}>
              <span className="card-number">{problem.number}</span>
              <h3>{problem.title}</h3>
              <p>{problem.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="solution-section" id="cozum" aria-labelledby="solution-title">
        <div className="section-wrap solution-inner">
          <div className="solution-heading">
            <p className="eyebrow eyebrow-light">Daha sade bir yol</p>
            <h2 id="solution-title">Planın, tek bir yerde.</h2>
            <p>Hizmet arayanların taleplerini hizmet verenlere net biçimde ulaştırır ve takibi anlaşılır hale getirir.</p>
          </div>
          <div className="solution-list">
            {solutions.map((solution) => (
              <article className="solution-item" key={solution.title}>
                <span className="solution-mark" aria-hidden="true">{solution.mark}</span>
                <div><h3>{solution.title}</h3><p>{solution.description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
