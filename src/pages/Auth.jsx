import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../AuthContext'
import { useLang } from '../LangContext'
import '../App.css'
import '../styles/auth.css'

export default function Auth() {
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') // 'signup' | null (login)
  const isSignup = mode === 'signup'
  const canSignup = isSignup && sessionStorage.getItem('whoiam_invite_ok') === '1'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [usePassword, setUsePassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const navigate = useNavigate()
  const { user } = useAuth()
  const { t, toggle } = useLang()
  const a = t.auth

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/chat', { replace: true })
  }, [user, navigate])

  // Custom cursor
  useEffect(() => {
    const cursor = document.getElementById('cursor')
    const ring = document.getElementById('cursorRing')
    if (!cursor || !ring) return
    let mx = 0, my = 0, rx = 0, ry = 0
    const onMove = (e) => { mx = e.clientX; my = e.clientY; cursor.style.left = mx + 'px'; cursor.style.top = my + 'px' }
    document.addEventListener('mousemove', onMove)
    const animate = () => { rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; requestAnimationFrame(animate) }
    animate()
    return () => document.removeEventListener('mousemove', onMove)
  }, [])

  // Signup requested but no invite — redirect to /enter
  if (isSignup && !canSignup) {
    return (
      <>
        <div id="cursor" className="cursor" />
        <div id="cursorRing" className="cursor-ring" />
        <nav>
          <Link to="/" className="nav-logo" style={{ opacity: 1, animation: 'none' }}>whoiam.love</Link>
          <div className="nav-links" style={{ opacity: 1, animation: 'none' }}>
            <button className="lang-toggle" onClick={toggle}>{t.langToggle}</button>
          </div>
        </nav>
        <main className="auth-page">
          <p className="section-label auth-label">{a.label}</p>
          <h1 className="auth-headline">{a.inviteRequired}<br /><em>{a.inviteRequiredEm}</em></h1>
          <p className="auth-sub">{a.inviteRequiredSub}</p>
          <Link to="/enter" className="auth-cta">{a.getInvite}</Link>
        </main>
      </>
    )
  }

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: isSignup && canSignup }
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
      if (isSignup) sessionStorage.removeItem('whoiam_invite_ok')
    }
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    let result
    if (isSignup && canSignup) {
      result = await supabase.auth.signUp({ email: email.trim(), password })
    } else {
      result = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    }
    setLoading(false)
    if (result.error) {
      setError(result.error.message)
    } else if (result.data?.user && !isSignup) {
      navigate('/chat', { replace: true })
    } else if (isSignup) {
      setSent(true)
      sessionStorage.removeItem('whoiam_invite_ok')
    }
  }

  if (sent) {
    return (
      <>
        <div id="cursor" className="cursor" />
        <div id="cursorRing" className="cursor-ring" />
        <nav>
          <Link to="/" className="nav-logo" style={{ opacity: 1, animation: 'none' }}>whoiam.love</Link>
          <div className="nav-links" style={{ opacity: 1, animation: 'none' }}>
            <button className="lang-toggle" onClick={toggle}>{t.langToggle}</button>
          </div>
        </nav>
        <main className="auth-page">
          <p className="section-label auth-label">{a.label}</p>
          <h1 className="auth-headline">{a.checkEmail}<br /><em>{a.checkEmailEm}</em></h1>
          <p className="auth-sub">{a.checkEmailSub}</p>
        </main>
      </>
    )
  }

  return (
    <>
      <div id="cursor" className="cursor" />
      <div id="cursorRing" className="cursor-ring" />

      <nav>
        <Link to="/" className="nav-logo" style={{ opacity: 1, animation: 'none' }}>whoiam.love</Link>
        <div className="nav-links" style={{ opacity: 1, animation: 'none' }}>
          <button className="lang-toggle" onClick={toggle}>{t.langToggle}</button>
        </div>
      </nav>

      <main className="auth-page">
        <p className="section-label auth-label">{a.label}</p>
        <h1 className="auth-headline">
          {isSignup ? a.signupHeadline : a.loginHeadline}<br />
          <em>{isSignup ? a.signupHeadlineEm : a.loginHeadlineEm}</em>
        </h1>
        <p className="auth-sub">{isSignup ? a.signupSub : a.loginSub}</p>

        <form className="auth-form" onSubmit={usePassword ? handlePassword : handleMagicLink}>
          <input
            type="email"
            className="auth-input"
            placeholder={a.emailPlaceholder}
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
            required
          />
          {usePassword && (
            <input
              type="password"
              className="auth-input"
              placeholder={a.passwordPlaceholder}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          )}
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-cta" disabled={loading}>
            {loading ? '…' : usePassword ? a.ctaPassword : a.ctaMagic}
          </button>
          <hr className="auth-divider" />
          <button
            type="button"
            className="auth-mode-toggle"
            onClick={() => { setUsePassword(p => !p); setError('') }}
          >
            {usePassword ? a.switchToMagic : a.switchToPassword}
          </button>
        </form>
      </main>
    </>
  )
}
