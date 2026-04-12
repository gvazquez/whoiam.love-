import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

export default function Home() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

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

  const steps = [
    {
      n: 'i.',
      title: 'You speak',
      body: "Start anywhere. A feeling, a fear, a memory. There's no wrong beginning. The AI meets you exactly where you are."
    },
    {
      n: 'ii.',
      title: 'It listens',
      body: "No advice. No judgment. Just the kind of deep attention that helps you hear yourself more clearly."
    },
    {
      n: 'iii.',
      title: 'You see yourself',
      body: "Patterns emerge. Contradictions surface. Every week, a portrait — assembled from your own words — of who you're becoming."
    },
  ]

  const questions = [
    "What's something you've never said out loud?",
    "When did you stop being who you were meant to be?",
    "What do you want that you're ashamed to want?",
    "Who are you when no one is watching?",
    "What would you do if you weren't afraid?",
    "What does love feel like when it's yours?",
  ]

  return (
    <>
      <div id="cursor" className="cursor" />
      <div id="cursorRing" className="cursor-ring" />

      <nav>
        <a href="#" className="nav-logo">whoiam.love</a>
        <div className="nav-links">
          <Link to="/pricing" className="nav-link-subtle">Pricing</Link>
          <Link to="/chat" className="nav-cta no-anim">Begin</Link>
        </div>
      </nav>

      <section className="hero">
        <p className="hero-eyebrow">A new kind of mirror</p>
        <h1 className="hero-headline">
          You've been<br />
          everything<br />
          to everyone.<br />
          <em>Who are you?</em>
        </h1>
        <p className="hero-sub">
          An AI that doesn't fix you,<br />
          advise you, or optimize you.<br />
          It simply helps you find yourself.
        </p>
        <Link to="/chat" className="hero-begin">
          <span className="arrow-line" />
          Begin
        </Link>
        <aside className="hero-aside">
          <p>"The longest journey is the journey inward."</p>
          <span>— Dag Hammarskjöld</span>
        </aside>
        <div className="scroll-hint">
          <div className="scroll-dot" />
          <p>Scroll</p>
        </div>
      </section>

      <div className="divider" />

      <section className="section-what">
        <div>
          <p className="section-label reveal">What this is</p>
          <h2 className="reveal reveal-delay-1">
            Not therapy.<br />
            Not a chatbot.<br />
            <em>A witness.</em>
          </h2>
        </div>
        <div className="section-what-right">
          <p className="reveal">
            Most of us have never had a space to speak freely — without being
            judged, advised, or redirected. We perform for everyone, including ourselves.
          </p>
          <p className="reveal reveal-delay-1">
            whoiam.love is an AI that listens differently. It asks the questions
            no one else does. It remembers everything you've said. Over time, it
            holds a portrait of you that you've built word by word.
          </p>
          <p className="reveal reveal-delay-2">
            Not a diagnosis. Not a score. A living record of who you are, becoming.
          </p>
        </div>
      </section>

      <section className="section-how">
        <p className="section-label reveal">How it works</p>
        <h2 className="reveal">
          The simplest thing.<br /><em>A conversation.</em>
        </h2>
        <div className="steps">
          {steps.map((s, i) => (
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
          <p className="section-label reveal">The questions</p>
          <h2 className="reveal">
            The ones<br />no one<br /><em>ever asks.</em>
          </h2>
        </div>
        <div className="question-list">
          {questions.map((q, i) => (
            <div className="question-item reveal" key={i}>
              <p>"{q}"</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-cta" id="begin">
        <h2 className="reveal">
          Ready to meet<br /><em>yourself?</em>
        </h2>
        <p className="reveal reveal-delay-1">
          Join the early access list. Be among the first to begin.
        </p>
        <div className="reveal reveal-delay-2">
          {!submitted ? (
            <form className="cta-form" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button type="submit">Begin →</button>
            </form>
          ) : null}
          <span className="cta-note">
            {submitted
              ? "You're on the list. The journey begins soon."
              : 'Free to start · No credit card · Just you'}
          </span>
        </div>
      </section>

      <footer>
        <p className="footer-logo">whoiam.love</p>
        <p>© 2026 · All rights reserved</p>
        <p>Made with love, powered by AI</p>
      </footer>
    </>
  )
}
