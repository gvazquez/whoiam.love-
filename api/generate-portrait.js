export const config = { runtime: 'edge' }

import { createClient } from '@supabase/supabase-js'

const PORTRAIT_SYSTEM = `You are writing a quiet, intimate portrait of someone based on what they have shared in conversation.`

function buildPortraitPrompt(messages, moods) {
  const moodList = moods.filter(Boolean).join(', ')
  const transcript = messages.map(m => `"${m.content}"`).join('\n')

  return `Below is a series of reflections someone has shared across several sessions.${
    moodList ? `\nTheir mood check-ins during this time: ${moodList}.` : ''
  }

${transcript}

Write a quiet, first-person paragraph (3–5 sentences) describing who this person is becoming.
Speak as if reading their journal from the outside — tender, precise, never clinical.
Do not name them. Do not summarize events. Do not list or analyze the moods directly.${
    moodList ? '\nLet the texture of the moods inform what you write — as weather informs a landscape.' : ''
  }
Describe their inner movement.`
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Don't regenerate if portrait already exists
  const { count } = await supabase
    .from('weekly_portraits')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (count > 0) {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Fetch all conversations with moods
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, mood_checkin')
    .eq('user_id', user.id)
    .order('started_at', { ascending: true })

  if (!conversations || conversations.length === 0) {
    return new Response(JSON.stringify({ error: 'No conversations' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const convIds = conversations.map(c => c.id)
  const moods = conversations.map(c => c.mood_checkin)

  // Fetch all user messages
  const { data: messages } = await supabase
    .from('messages')
    .select('content')
    .in('conversation_id', convIds)
    .eq('role', 'user')
    .order('created_at', { ascending: true })

  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'No messages' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  const portraitPrompt = buildPortraitPrompt(messages, moods)

  let portraitText = ''
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: PORTRAIT_SYSTEM,
        messages: [{ role: 'user', content: portraitPrompt }],
      }),
    })

    if (!res.ok) {
      throw new Error(`Anthropic error ${res.status}`)
    }

    const data = await res.json()
    portraitText = data.content?.[0]?.text ?? ''
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  await supabase.from('weekly_portraits').insert({
    user_id: user.id,
    portrait_text: portraitText,
    session_count: conversations.length,
  })

  return new Response(JSON.stringify({ portrait: portraitText }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
