import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../LangContext'
import { useAuth } from '../AuthContext'
import { supabase } from '../lib/supabase'
import '../App.css'
import '../styles/portrait.css'

const MOOD_KEYS = ['foggy', 'heavy', 'restless', 'okay', 'curious', 'open', 'alive']

function relativeDate(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 14) return '1 week ago'
  return `${Math.floor(days / 7)} weeks ago`
}

export default function Portrait() {
  const { t, toggle } = useLang()
  const { user } = useAuth()
  const [portrait, setPortrait] = useState(null)
  const [moodHistory, setMoodHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      const [portraitRes, moodsRes] = await Promise.all([
        supabase
          .from('weekly_portraits')
          .select('portrait_text, generated_at')
          .eq('user_id', user.id)
          .order('generated_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('conversations')
          .select('mood_checkin, started_at')
          .eq('user_id', user.id)
          .not('mood_checkin', 'is', null)
          .order('started_at', { ascending: false })
          .limit(20),
      ])

      setPortrait(portraitRes.data ?? null)
      setMoodHistory(moodsRes.data ?? [])
      setLoading(false)
    }

    fetchData()
  }, [user])

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

  return (
    <>
      <div id="cursor" className="cursor" />
      <div id="cursorRing" className="cursor-ring" />

      <nav>
        <Link to="/" className="nav-logo" style={{ opacity: 1, animation: 'none' }}>whoiam.love</Link>
        <div className="nav-links" style={{ opacity: 1, animation: 'none' }}>
          <button className="lang-toggle" onClick={toggle}>{t.langToggle}</button>
          <Link to="/chat" className="nav-cta no-anim">{t.nav.begin}</Link>
        </div>
      </nav>

      <div className="portrait-page">
        <main className="portrait-main">
          <p className="portrait-label">{t.portrait.label}</p>

          {loading ? null : portrait ? (
            <>
              <p className="portrait-text">{portrait.portrait_text}</p>

              {moodHistory.length >= 2 && (
                <div className="mood-timeline">
                  <p className="mood-timeline-label">{t.portrait.moodHistory}</p>
                  <div className="mood-timeline-items">
                    {moodHistory.map((entry, i) => (
                      <div key={i} className="mood-timeline-item">
                        <span className="mood-timeline-word">
                          {t.mood.options[entry.mood_checkin]}
                        </span>
                        <span className="mood-timeline-date">
                          {relativeDate(entry.started_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="portrait-empty">{t.portrait.empty}</p>
          )}
        </main>
      </div>
    </>
  )
}
