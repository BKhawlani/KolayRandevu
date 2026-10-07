import { CallToAction } from './components/CallToAction'
import { Footer } from './components/Footer'
import { HeroSection } from './components/HeroSection'
import { HowItWorks } from './components/HowItWorks'
import { ServicesSection } from './components/ServicesSection'
import { ValueSections } from './components/ValueSections'
import { Navbar } from './components/Navbar'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { UserDashboard } from './pages/UserDashboard'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProviderDashboard } from './pages/ProviderDashboard'
import { ServicesPage } from './pages/ServicesPage'
import { AccountPage } from './pages/AccountPage'
import { AdminPage } from './pages/AdminPage'

function LandingPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">İçeriğe geç</a>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <ValueSections />
        <HowItWorks />
        <ServicesSection />
        <CallToAction />
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/hizmetler" element={<ServicesPage />} />
      <Route path="/services" element={<Navigate to="/hizmetler" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/provider-dashboard" element={<ProtectedRoute><ProviderDashboard /></ProtectedRoute>} />
      <Route path="/hesabim" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
