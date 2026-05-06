import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { useAuth } from '../AuthContext'
import '../App.css'
import '../styles/pricing.css'

export default function Pricing() {
  const { t, lang, toggle } = useLang()
  const { user, session, profile } = useAuth()
  const navigate = useNavigate()
  const p = t.pricing
  const [checkingOut, setCheckingOut] = useState(false)

  const isSubscribed = profile?.subscription_status === 'active'

  // Custom cursor
  useEffect(() => {
    const cursor = document.getElementById('cursor')
    const ring = document.getElementById('cursorRing')
    if (!cursor || !ring) return
    let mx = 0, my = 0, rx = 0, ry = 0
    const onMove = (e) => {
      mx = e.clientX; my = e.clientY
      cursor.style.left = mx + 'px'
      cursor.style.top = my + 'px'
    }
    document.addEventListener('mousemove', onMove)
    const animate = () => {
      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12
      ring.style.left = rx + 'px'
      ring.style.top = ry + 'px'
      requestAnimationFrame(animate)
    }
    animate()
    return () => document.removeEventListener('mousemove', onMove)
  }, [])

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          observer.unobserve(e.target)
        }
      })
    }, { threshold: 0.15 })
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const handleCheckout = async () => {
    if (!user) {
      navigate('/enter')
      return
    }
    setCheckingOut(true)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setCheckingOut(false)
    }
  }

  return (
    <>
      <div id="cursor" className="cursor" />
      <div id="cursorRing" className="cursor-ring" />

      <nav>
        <Link to="/" className="nav-logo" style={{ opacity: 1, animation: 'none' }}>whoiam.love</Link>
        <div className="nav-links" style={{ opacity: 1, animation: 'none' }}>
          <button className="lang-toggle" onClick={toggle}>{t.langToggle}</button>
          <Link to="/pricing" className="nav-link-subtle">{t.nav.pricing}</Link>
          <Link to="/chat" className="nav-cta no-anim">{t.nav.begin}</Link>
        </div>
      </nav>

      <main className="pricing-page">
        <section className="pricing-header">
          <p className="section-label reveal">{p.label}</p>
          <h2 className="pricing-headline reveal reveal-delay-1">
            {p.headlineL1}<br /><em>{p.headlineEm}</em>
          </h2>
          <p className="pricing-sub reveal reveal-delay-2">{p.sub}</p>
        </section>

        <section className="pricing-cards">
          <div className="pricing-card reveal">
            <p className="card-tier">{p.discover.tier}</p>
            <p className="card-price">{p.discover.price}</p>
            <p className="card-description">{p.discover.description}</p>
            <ul className="card-features">
              {p.discover.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <Link to="/chat" className="card-cta">{p.discover.cta}</Link>
          </div>

          <div className="pricing-card pricing-card--featured reveal reveal-delay-1">
            {isSubscribed ? (
              <p className="card-badge card-badge--active">{p.experience.currentPlan}</p>
            ) : (
              <p className="card-badge">{p.experience.badge}</p>
            )}
            <p className="card-tier">{p.experience.tier}</p>
            <p className="card-price">{p.experience.price}<span>{p.experience.period}</span></p>
            <p className="card-description">{p.experience.description}</p>
            <ul className="card-features">
              {p.experience.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            {isSubscribed ? (
              <Link to="/portrait" className="card-cta">{t.portrait.label}</Link>
            ) : (
              <button
                className="card-cta"
                onClick={handleCheckout}
                disabled={checkingOut}
              >
                {checkingOut ? '…' : p.experience.cta}
              </button>
            )}
          </div>
        </section>
      </main>

      <footer>
        <p className="footer-logo">whoiam.love</p>
        <p>{t.home.footerRights}</p>
        <p>{t.home.footerMade}</p>
      </footer>
    </>
  )
}
