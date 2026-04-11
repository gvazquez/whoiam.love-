import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import '../styles/chat.css'

const OPENING = "What's something you've never said out loud?"

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: OPENING }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

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

  const send = async () => {
    console.log('send called', { input, loading })
    const text = input.trim()
    if (!text || loading) {
      console.log('send blocked — empty text or loading', { text, loading })
      return
    }

    const userMsg = { role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    // Anthropic requires messages to start with role 'user'
    const apiMessages = updatedMessages
      .slice(updatedMessages.findIndex(m => m.role === 'user'))
      .map(m => ({ role: m.role, content: m.content }))

    console.log('sending...', { apiMessages })
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      })

      if (!response.ok) throw new Error('API error')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''
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
                // Add the assistant message placeholder on the first token
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
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Something interrupted the silence. Try again.' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  // Show ellipsis only while waiting for the first token (last message is still the user's)
  const waitingForResponse = loading && messages[messages.length - 1]?.role === 'user'

  return (
    <div className="chat-page">
      <div id="chat-cursor" className="cursor" />
      <div id="chat-cursor-ring" className="cursor-ring" />

      <header className="chat-header">
        <Link to="/" className="chat-logo">whoiam.love</Link>
      </header>

      <main className="chat-messages">
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
            placeholder="Speak freely…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            disabled={loading}
          />
          <button
            className="chat-send"
            onClick={send}
            disabled={!input.trim() || loading}
            aria-label="Send"
          >
            Send
          </button>
        </div>
        <p className="chat-hint">Enter to send · Shift + Enter for new line</p>
      </footer>
    </div>
  )
}
