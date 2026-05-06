import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../LangContext'
import { useAuth } from '../AuthContext'
import '../styles/chat.css'

const MOOD_KEYS = ['foggy', 'heavy', 'restless', 'okay', 'curious', 'open', 'alive']

export default function Chat() {
  const { t, toggle } = useLang()
  const { user, session, profile } = useAuth()
  const isSubscriber = profile?.subscription_status === 'active'

  // Phase: 'mood' shown first, then 'chat'
  const [phase, setPhase] = useState('mood')
  const [mood, setMood] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [memory, setMemory] = useState(null)

  const [messages, setMessages] = useState([
    { role: 'assistant', content: t.chat.opening }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // Payment success banner
  const [showMemoryWelcome] = useState(
    () => new URLSearchParams(window.location.search).get('payment') === 'success'
  )

  const isFirstMessage = useRef(true)
  const bottomRef = useRef(null)

  // Clear ?payment=success from URL and auto-dismiss banner
  useEffect(() => {
    if (showMemoryWelcome) {
      window.history.replaceState({}, '', '/chat')
    }
  }, [showMemoryWelcome])

  // Fetch memory context for Experience subscribers
  useEffect(() => {
    if (!user || !isSubscriber || !session) return
    fetch('/api/context', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.memory) setMemory(data.memory) })
      .catch(() => {})
  }, [user, isSubscriber, session])

  // Custom cursor
  useEffect(() => {
    const cursor = document.getElementById('chat-cursor')
    const ring = document.getElementById('chat-cursor-ring')
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

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const startConversation = async (selectedMood) => {
    setMood(selectedMood)
    if (user && session) {
      try {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ mood: selectedMood }),
        })
        if (res.ok) {
          const data = await res.json()
          setConversationId(data.id)
        }
      } catch {}
    }
    setPhase('chat')
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    const apiMessages = updatedMessages
      .slice(updatedMessages.findIndex(m => m.role === 'user'))
      .map(m => ({ role: m.role, content: m.content }))

    const body = { messages: apiMessages }
    if (isFirstMessage.current) {
      if (mood) body.mood = mood
      if (memory) body.memory = memory
      isFirstMessage.current = false
    }

    let assistantText = ''
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error('API error')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let started = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value, { stream: true }).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) {
              if (!started) {
                setMessages(prev => [...prev, { role: 'assistant', content: '' }])
                started = true
              }
              assistantText += parsed.text
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: assistantText }
                return updated
              })
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: t.chat.error }])
    } finally {
      setLoading(false)
    }

    // Persist to Supabase after stream completes
    if (conversationId && assistantText && user && session) {
      fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          user_message: text,
          assistant_message: assistantText,
        }),
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.shouldGeneratePortrait) {
            // Fire-and-forget portrait generation
            fetch('/api/generate-portrait', {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}` },
            }).catch(() => {})
          }
        })
        .catch(() => {})
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const waitingForResponse = loading && messages[messages.length - 1]?.role === 'user'

  return (
    <div className="chat-page">
      <div id="chat-cursor" className="cursor" />
      <div id="chat-cursor-ring" className="cursor-ring" />

      {showMemoryWelcome && (
        <div className="memory-welcome">{t.chat.memoryWelcome}</div>
      )}

      <header className="chat-header">
        <Link to="/" className="chat-logo">whoiam.love</Link>
        <button className="lang-toggle" onClick={toggle} style={{ marginLeft: 'auto' }}>
          {t.langToggle}
        </button>
      </header>

      {phase === 'mood' ? (
        <div className="mood-screen">
          <p className="mood-prompt">{t.mood.prompt}</p>
          <div className="mood-options">
            {MOOD_KEYS.map(key => (
              <button
                key={key}
                className="mood-option"
                onClick={() => startConversation(key)}
              >
                {t.mood.options[key]}
              </button>
            ))}
          </div>
          <button className="mood-skip" onClick={() => startConversation(null)}>
            {t.mood.skip}
          </button>
        </div>
      ) : (
        <>
          <main className="chat-messages">
            {memory && (
              <p className="memory-hint">{t.chat.memoryHint}</p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`chat-message chat-message--${m.role}`}
                style={{ animationDelay: `${i === 0 ? 0.4 : 0}s` }}
              >
                <p>{m.content}</p>
              </div>
            ))}
            {waitingForResponse && (
              <div className="chat-message chat-message--assistant chat-message--loading">
                <span className="chat-ellipsis">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </main>

          <footer className="chat-input-area">
            <div className="chat-input-row">
              <textarea
                className="chat-textarea"
                placeholder={t.chat.placeholder}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                disabled={loading}
                autoFocus
              />
              <button
                className="chat-send"
                onClick={send}
                disabled={!input.trim() || loading}
                aria-label={t.chat.send}
              >
                {t.chat.send}
              </button>
            </div>
            <p className="chat-hint">{t.chat.hint}</p>
          </footer>
        </>
      )}
    </div>
  )
}
