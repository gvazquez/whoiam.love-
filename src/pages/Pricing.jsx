import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'
import '../styles/pricing.css'

const discoverFeatures = [
  'Unlimited conversations',
  'AI that listens deeply',
  'One question at a time',
  'No memory between sessions',
]

const experienceFeatures = [
  'Everything in Discover',
  'Memory across all sessions',
  'AI notices patterns over time',
  'Weekly self-portrait',
  'Priority access to new features',
]

export default function Pricing() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  const handleWaitlist = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {}
    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <>
      <div id="cursor" className="cursor" />
      <div id="cursorRing" className="cursor-ring" />

      <nav>
        <Link to="/" className="nav-logo" style={{ opacity: 1, animation: 'none' }}>whoiam.love</Link>
        <div className="nav-links" style={{ opacity: 1, animation: 'none' }}>
          <Link to="/pricing" className="nav-link-subtle">Pricing</Link>
          <Link to="/chat" className="nav-cta no-anim">Begin</Link>
        </div>
      </nav>

      <main className="pricing-page">
        <section className="pricing-header">
          <p className="section-label reveal">Pricing</p>
          <h2 className="pricing-headline reveal reveal-delay-1">
            Choose how deep<br /><em>you want to go.</em>
          </h2>
          <p className="pricing-sub reveal reveal-delay-2">
            Start free. Go deeper when you're ready.
          </p>
        </section>

        <section className="pricing-cards">
          <div className="pricing-card reveal">
            <p className="card-tier">Discover</p>
            <p className="card-price">Free</p>
            <p className="card-description">
              A space to speak. An AI that holds the silence with you, asks the question no one else does.
            </p>
            <ul className="card-features">
              {discoverFeatures.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <Link to="/chat" className="card-cta">
              Begin Discovering
            </Link>
          </div>

          <div className="pricing-card pricing-card--featured reveal reveal-delay-1">
            <p className="card-badge">Coming soon</p>
            <p className="card-tier">Experience</p>
            <p className="card-price">$12<span>/month</span></p>
            <p className="card-description">
              The AI begins to know you. Patterns surface. A portrait emerges — assembled, over time, from your own words.
            </p>
            <ul className="card-features">
              {experienceFeatures.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            {!submitted ? (
              <form className="card-waitlist-form" onSubmit={handleWaitlist}>
                <input
                  type="email"
                  className="card-waitlist-input"
                  placeholder="Your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="card-cta"
                  disabled={submitting}
                >
                  {submitting ? '…' : 'Join the Waitlist'}
                </button>
              </form>
            ) : (
              <p className="card-waitlist-confirm">
                You're on the list.<br />
                <em>Something is coming.</em>
              </p>
            )}
          </div>
        </section>
      </main>

      <footer>
        <p className="footer-logo">whoiam.love</p>
        <p>© 2026 · All rights reserved</p>
        <p>Made with love, powered by AI</p>
      </footer>
    </>
  )
}
