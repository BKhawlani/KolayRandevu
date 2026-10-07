import type { ReactNode } from 'react'
import { Navbar } from './Navbar'

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <>
      <Navbar />
      <main className="auth-page">
      <div className="auth-grid">
        <section className="auth-intro" aria-labelledby="auth-title">
          <p className="eyebrow"><span className="eyebrow-dot" /> {eyebrow}</p>
          <h1 id="auth-title">{title}</h1>
          <p>{description}</p>
          <div className="auth-intro-note"><span aria-hidden="true">✓</span> Taleplerin ve güncellemelerin tek yerde.</div>
        </section>
        <section className="auth-card" aria-label={eyebrow}>
          {children}
        </section>
      </div>
      <p className="auth-legal">Devam ederek KolayRandevu kullanım koşullarını kabul etmiş olursun.</p>
      </main>
    </>
  )
}
