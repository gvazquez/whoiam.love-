import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { supabase } from '../lib/supabase'
import '../App.css'
import '../styles/enter.css'

export default function Enter() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const navigate = useNavigate()
  const { t, lang, toggle } = useLang()

  // Cursor
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

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) navigate('/chat', { replace: true })
    })
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setChecking(true)
    setError('')
    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      if (res.ok) {
        sessionStorage.setItem('whoiam_invite_ok', '1')
        navigate('/auth?mode=signup', { replace: true })
      } else {
        setError(t.enter.error)
      }
    } catch {
      setError(t.enter.error)
    } finally {
      setChecking(false)
    }
  }

  return (
    <>
      <div id="cursor" className="cursor" />
      <div id="cursorRing" className="cursor-ring" />

      <nav>
        <a href="/" className="nav-logo" style={{ opacity: 1, animation: 'none' }}>whoiam.love</a>
        <div className="nav-links" style={{ opacity: 1, animation: 'none' }}>
          <button className="lang-toggle" onClick={toggle}>{t.langToggle}</button>
        </div>
      </nav>

      <main className="enter-page">
        <p className="section-label enter-label">{t.enter.label}</p>
        <h1 className="enter-headline">
          {t.enter.headlineL1}<br />
          <em>{t.enter.headlineEm}</em>
        </h1>
        <p className="enter-sub">{t.enter.sub}</p>
        <form className="enter-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="enter-input"
            placeholder={t.enter.placeholder}
            value={code}
            onChange={e => setCode(e.target.value)}
            autoFocus
            autoComplete="off"
            required
          />
          {error && <p className="enter-error">{error}</p>}
          <button type="submit" className="enter-cta" disabled={checking}>
            {checking ? '…' : t.enter.cta}
          </button>
        </form>
      </main>
    </>
  )
}
