import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../LangContext'
import '../App.css'

export default function Home() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { t, lang, toggle } = useLang()

  // Cursor
  useEffect(() => {
    const cursor = document.getElementById('cursor')
    const ring = document.getElementById('cursorRing')
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

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      <div id="cursor" className="cursor" />
      <div id="cursorRing" className="cursor-ring" />

      <nav>
        <a href="#" className="nav-logo">whoiam.love</a>
        <div className="nav-links">
          <button className="lang-toggle" onClick={toggle}>{t.langToggle}</button>
          <Link to="/pricing" className="nav-link-subtle">{t.nav.pricing}</Link>
          <Link to="/chat" className="nav-cta no-anim">{t.nav.begin}</Link>
        </div>
      </nav>

      <section className="hero">
        <p className="hero-eyebrow">{t.home.eyebrow}</p>
        <h1 className="hero-headline">
          {t.home.headlineL1}<br />
          {t.home.headlineL2}<br />
          {t.home.headlineL3}<br />
          <em>{t.home.headlineEm}</em>
        </h1>
        <p className="hero-sub">
          {t.home.subL1}<br />
          {t.home.subL2}<br />
          {t.home.subL3}
        </p>
        <Link to="/chat" className="hero-begin">
          <span className="arrow-line" />
          {t.home.begin}
        </Link>
        <aside className="hero-aside">
          <p>{t.home.quote}</p>
          <span>{t.home.quoteAuthor}</span>
        </aside>
        <div className="scroll-hint">
          <div className="scroll-dot" />
          <p>{t.home.scroll}</p>
        </div>
      </section>

      <div className="divider" />

      <section className="section-what">
        <div>
          <p className="section-label reveal">{t.home.whatLabel}</p>
          <h2 className="reveal reveal-delay-1">
            {t.home.whatH2L1}<br />
            {t.home.whatH2L2}<br />
            <em>{t.home.whatH2Em}</em>
          </h2>
        </div>
        <div className="section-what-right">
          <p className="reveal">{t.home.whatP1}</p>
          <p className="reveal reveal-delay-1">{t.home.whatP2}</p>
          <p className="reveal reveal-delay-2">{t.home.whatP3}</p>
        </div>
      </section>

      <section className="section-how">
        <p className="section-label reveal">{t.home.howLabel}</p>
        <h2 className="reveal">
          {t.home.howH2L1}<br /><em>{t.home.howH2Em}</em>
        </h2>
        <div className="steps">
          {t.home.steps.map((s, i) => (
            <div className={`step reveal reveal-delay-${i}`} key={i}>
              <p className="step-num">{s.n}</p>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-questions">
        <div>
          <p className="section-label reveal">{t.home.questionsLabel}</p>
          <h2 className="reveal">
            {t.home.questionsH2L1}<br />
            {t.home.questionsH2L2}<br />
            <em>{t.home.questionsH2Em}</em>
          </h2>
        </div>
        <div className="question-list">
          {t.home.questions.map((q, i) => (
            <div className="question-item reveal" key={i}>
              <p>"{q}"</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-cta" id="begin">
        <h2 className="reveal">
          {t.home.ctaH2L1}<br /><em>{t.home.ctaH2Em}</em>
        </h2>
        <p className="reveal reveal-delay-1">{t.home.ctaSub}</p>
        <div className="reveal reveal-delay-2">
          {!submitted ? (
            <form className="cta-form" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder={t.home.ctaPlaceholder}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button type="submit">{t.home.ctaBtn}</button>
            </form>
          ) : null}
          <span className="cta-note">
            {submitted ? t.home.ctaConfirm : t.home.ctaNote}
          </span>
        </div>
      </section>

      <footer>
        <p className="footer-logo">whoiam.love</p>
        <p>{t.home.footerRights}</p>
        <p>{t.home.footerMade}</p>
      </footer>
    </>
  )
}
